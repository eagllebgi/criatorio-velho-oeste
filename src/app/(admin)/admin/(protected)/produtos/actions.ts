"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export interface ProductFormState {
  error: string | null;
}

function parseProductForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const shortDescription = String(formData.get("short_description") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const priceRaw = String(formData.get("price") ?? "").trim();
  const stockRaw = String(formData.get("stock") ?? "0").trim();
  const lowStockRaw = String(formData.get("low_stock_threshold") ?? "5").trim();
  const displayOrderRaw = String(formData.get("display_order") ?? "0").trim();
  const active = formData.get("active") === "on";
  const featured = formData.get("featured") === "on";

  return {
    name,
    category_id: categoryId,
    short_description: shortDescription,
    description,
    price: priceRaw ? Number(priceRaw.replace(",", ".")) : null,
    stock: Number(stockRaw) || 0,
    low_stock_threshold: Number(lowStockRaw) || 0,
    display_order: Number(displayOrderRaw) || 0,
    active,
    featured,
  };
}

export async function createProduct(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const values = parseProductForm(formData);
  if (!values.name) return { error: "Informe o nome da raça." };

  const supabase = await createClient();
  const slug = slugify(values.name);

  const { error } = await supabase.from("products").insert({ ...values, slug });

  if (error) {
    return {
      error: error.code === "23505" ? "Já existe uma raça com esse nome." : error.message,
    };
  }

  revalidatePath("/admin/produtos");
  revalidatePath("/ovos");
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
  const { error } = await supabase
    .from("products")
    .update(values)
    .eq("id", productId);

  if (error) return { error: error.message };

  revalidatePath("/admin/produtos");
  revalidatePath("/ovos");
  revalidatePath(`/ovos/${slugify(values.name)}`);
  redirect("/admin/produtos");
}

export async function toggleProductActive(productId: string, nextActive: boolean) {
  const supabase = await createClient();
  await supabase.from("products").update({ active: nextActive }).eq("id", productId);
  revalidatePath("/admin/produtos");
  revalidatePath("/ovos");
}

export async function toggleProductFeatured(productId: string, nextFeatured: boolean) {
  const supabase = await createClient();
  await supabase.from("products").update({ featured: nextFeatured }).eq("id", productId);
  revalidatePath("/admin/produtos");
  revalidatePath("/");
}

/** Edição rápida de preço direto na listagem (sem abrir o formulário completo). */
export async function updateProductPriceQuick(
  productId: string,
  price: number | null,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ price: price !== null && price >= 0 ? price : null })
    .eq("id", productId);

  if (error) return { error: error.message };

  revalidatePath("/admin/produtos");
  revalidatePath("/admin/precos");
  revalidatePath("/ovos");
  return { error: null };
}

/** Edição rápida de estoque direto na listagem (sem abrir o formulário completo). */
export async function updateProductStockQuick(
  productId: string,
  stock: number,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ stock: Math.max(0, stock) })
    .eq("id", productId);

  if (error) return { error: error.message };

  revalidatePath("/admin/produtos");
  revalidatePath("/admin/estoque");
  revalidatePath("/admin");
  revalidatePath("/ovos");
  return { error: null };
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient();
  await supabase.from("products").delete().eq("id", productId);
  revalidatePath("/admin/produtos");
  revalidatePath("/ovos");
}
