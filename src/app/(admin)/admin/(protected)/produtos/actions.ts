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
  // Preço por idade — só o ProductForm manda esses campos quando o tipo é
  // "ave" (ver ProductForm.tsx); pra "ovo" eles nem existem no formulário,
  // então ficam null aqui, igual ao resto dos 4 campos quando em branco.
  const price1To30Raw = String(formData.get("price_1_30") ?? "").trim();
  const price31To60Raw = String(formData.get("price_31_60") ?? "").trim();
  const price61To90Raw = String(formData.get("price_61_90") ?? "").trim();
  const price91To120Raw = String(formData.get("price_91_120") ?? "").trim();
  const lowStockRaw = String(formData.get("low_stock_threshold") ?? "5").trim();
  const active = formData.get("active") === "on";
  const featured = formData.get("featured") === "on";
  const productType = String(formData.get("product_type") ?? "ovo") === "ave" ? "ave" : "ovo";

  // Estoque de raça "Ave" não vem do formulário (o campo fica desabilitado e
  // sem "name" no ProductForm quando product_type é "ave") — é calculado
  // sozinho por gatilho no banco a partir do Plantel (ver
  // 0008_postura_login_ave_stock.sql). Só raça "Ovo" manda estoque digitado
  // à mão; pra "Ave" nem incluímos a coluna no insert/update, pra nunca
  // sobrescrever o valor calculado com um "0" de campo ausente.
  const stockRaw = String(formData.get("stock") ?? "").trim();
  const stock = productType === "ave" ? undefined : Number(stockRaw) || 0;

  return {
    name,
    short_description: shortDescription,
    description,
    price: priceRaw ? Number(priceRaw.replace(",", ".")) : null,
    price_1_30: price1To30Raw ? Number(price1To30Raw.replace(",", ".")) : null,
    price_31_60: price31To60Raw ? Number(price31To60Raw.replace(",", ".")) : null,
    price_61_90: price61To90Raw ? Number(price61To90Raw.replace(",", ".")) : null,
    price_91_120: price91To120Raw ? Number(price91To120Raw.replace(",", ".")) : null,
    stock,
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

/**
 * "Duplicar" — cria uma cópia de um produto já cadastrado (mesmo tipo,
 * categoria, descrição, preços e fotos) pra não ter que preencher tudo de
 * novo quando a raça já existe e só falta criar a outra versão dela (ex: já
 * tem o Ovo da Angola Canela, quer criar a Ave) ou uma variação parecida.
 * A cópia nasce INATIVA (nunca aparece no site sozinha) e com nome
 * "(cópia)" no final, justamente pra forçar passar pela tela de edição antes
 * de publicar — trocar o tipo/nome/preço e, se for o caso, ativar.
 *
 * Estoque sempre começa zerado na cópia: mesmo copiando um Ovo com estoque
 * físico de verdade, esses ovos continuam sendo do item original, não da
 * cópia — então nunca faz sentido herdar o número.
 */
export async function duplicateProduct(productId: string) {
  const supabase = await createClient();

  const { data: source, error: fetchError } = await supabase
    .from("products")
    .select("*, product_images ( image_url, display_order )")
    .eq("id", productId)
    .maybeSingle();

  if (fetchError || !source) {
    redirect("/admin/produtos");
  }

  const baseName = `${source.name} (cópia)`;
  const baseSlug = slugify(baseName);

  // Slug único por tipo (ver 0005_produtos_financeiro.sql) — tenta o slug
  // "normal" da cópia e, se já existir (ex: duplicou a mesma raça mais de uma
  // vez), vai incrementando até achar um livre.
  let slug = baseSlug;
  for (let attempt = 2; ; attempt++) {
    const { data: clash } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .eq("product_type", source.product_type)
      .maybeSingle();
    if (!clash) break;
    slug = `${baseSlug}-${attempt}`;
  }

  const { data: created, error: insertError } = await supabase
    .from("products")
    .insert({
      name: baseName,
      slug,
      category_id: source.category_id,
      short_description: source.short_description,
      description: source.description,
      price: source.price,
      price_1_30: source.price_1_30,
      price_31_60: source.price_31_60,
      price_61_90: source.price_61_90,
      price_91_120: source.price_91_120,
      stock: 0,
      low_stock_threshold: source.low_stock_threshold,
      main_image: source.main_image,
      active: false,
      featured: false,
      display_order: source.display_order,
      product_type: source.product_type,
    })
    .select("id")
    .single();

  if (insertError || !created) {
    redirect("/admin/produtos");
  }

  // Copia a galeria de fotos também (reaproveita as mesmas URLs do Storage —
  // não reenvia arquivo nenhum, mesmo princípio da cascata automática de
  // fotos entre raça/baia/ave em 0006_fotos_cascata.sql).
  const images = (source.product_images ?? []) as { image_url: string; display_order: number }[];
  if (images.length > 0) {
    await supabase.from("product_images").insert(
      images.map((img) => ({
        product_id: created.id,
        image_url: img.image_url,
        display_order: img.display_order,
      })),
    );
  }

  revalidatePath("/admin/produtos");
  redirect(`/admin/produtos/${created.id}`);
}
