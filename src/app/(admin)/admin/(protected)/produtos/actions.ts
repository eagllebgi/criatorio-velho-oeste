"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export interface ProductFormState {
  error: string | null;
}

/** Sentinel usado no <select> de categoria do ProductForm pra indicar que o
 * usuário digitou o nome de uma categoria nova em vez de escolher uma
 * existente — ver resolveCategoryId abaixo. */
const NOVA_CATEGORIA = "__nova__";

function parseProductForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const shortDescription = String(formData.get("short_description") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const priceRaw = String(formData.get("price") ?? "").trim();
  const stockRaw = String(formData.get("stock") ?? "0").trim();
  const lowStockRaw = String(formData.get("low_stock_threshold") ?? "5").trim();
  const active = formData.get("active") === "on";
  const featured = formData.get("featured") === "on";
  const productType = String(formData.get("product_type") ?? "ovo") === "ave" ? "ave" : "ovo";

  return {
    name,
    short_description: shortDescription,
    description,
    price: priceRaw ? Number(priceRaw.replace(",", ".")) : null,
    stock: Number(stockRaw) || 0,
    low_stock_threshold: Number(lowStockRaw) || 0,
    active,
    featured,
    product_type: productType as "ovo" | "ave",
  };
}

/** Resolve o `category_id` a usar no produto: se o formulário veio com uma
 * categoria existente selecionada, só repassa o id; se veio com "+ Nova
 * categoria", cria a categoria na hora (reaproveitando uma já existente com
 * o mesmo nome, se houver) — assim não precisa mais de uma tela separada só
 * pra cadastrar categoria antes de cadastrar a raça. */
async function resolveCategoryId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  formData: FormData,
): Promise<{ categoryId: string | null; error: string | null }> {
  const raw = String(formData.get("category_id") ?? "");
  if (raw !== NOVA_CATEGORIA) {
    return { categoryId: raw || null, error: null };
  }

  const nome = String(formData.get("nova_categoria") ?? "").trim();
  if (!nome) return { categoryId: null, error: "Informe o nome da nova categoria." };

  const slug = slugify(nome);

  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) return { categoryId: existing.id, error: null };

  const { data: created, error } = await supabase
    .from("categories")
    .insert({ name: nome, slug, display_order: 0 })
    .select("id")
    .single();

  if (error || !created) {
    return { categoryId: null, error: error?.message ?? "Não foi possível criar a categoria." };
  }

  revalidatePath("/ovos");
  revalidatePath("/aves");
  return { categoryId: created.id, error: null };
}

export async function createProduct(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const values = parseProductForm(formData);
  if (!values.name) return { error: "Informe o nome da raça." };

  const supabase = await createClient();
  const { categoryId, error: categoryError } = await resolveCategoryId(supabase, formData);
  if (categoryError) return { error: categoryError };

  const slug = slugify(values.name);

  const { error } = await supabase
    .from("products")
    .insert({ ...values, category_id: categoryId, slug });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Já existe uma raça com esse nome e esse tipo (Ovo/Ave)."
          : error.message,
    };
  }

  revalidatePath("/admin/produtos");
  revalidatePath("/ovos");
  revalidatePath("/aves");
  redirect("/admin/produtos");
}

export async function updateProduct(
  productId: string,
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const values = parseProductForm(formData);
  if (!values.name) return { error: "Informe o nome da raça." };

  const supabase = await createClient();
  const { categoryId, error: categoryError } = await resolveCategoryId(supabase, formData);
  if (categoryError) return { error: categoryError };

  const { error } = await supabase
    .from("products")
    .update({ ...values, category_id: categoryId })
    .eq("id", productId);

  if (error) return { error: error.message };

  revalidatePath("/admin/produtos");
  revalidatePath("/ovos");
  revalidatePath("/aves");
  revalidatePath(`/ovos/${slugify(values.name)}`);
  revalidatePath(`/aves/${slugify(values.name)}`);
  redirect("/admin/produtos");
}

export async function toggleProductActive(productId: string, nextActive: boolean) {
  const supabase = await createClient();
  await supabase.from("products").update({ active: nextActive }).eq("id", productId);
  revalidatePath("/admin/produtos");
  revalidatePath("/ovos");
  revalidatePath("/aves");
}

export async function toggleProductFeatured(productId: string, nextFeatured: boolean) {
  const supabase = await createClient();
  await supabase.from("products").update({ featured: nextFeatured }).eq("id", productId);
  revalidatePath("/admin/produtos");
  revalidatePath("/");
}

// A edição rápida de preço e de estoque (usadas nesta tabela e também direto
// nas páginas públicas quando o admin está logado) moram em
// @/lib/actions/products — veja updateProductPriceQuick e
// updateProductStockQuick lá.

export async function deleteProduct(productId: string) {
  const supabase = await createClient();
  await supabase.from("products").delete().eq("id", productId);
  revalidatePath("/admin/produtos");
  revalidatePath("/ovos");
  revalidatePath("/aves");
}
