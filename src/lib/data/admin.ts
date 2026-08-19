import { createClient } from "@/lib/supabase/server";
import { mapCategory, mapProduct } from "@/lib/data/mappers";
import type { Category, Product } from "@/lib/types/domain";

const PRODUCT_SELECT = `
  *,
  categories ( name, slug ),
  product_images ( id, image_url, display_order )
`;

/** Todos os produtos (ativos e inativos), para o painel administrativo. */
export async function getAllProductsAdmin(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("getAllProductsAdmin error:", error.message);
    return [];
  }

  return (data ?? []).map(mapProduct);
}

export async function getProductByIdAdmin(id: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapProduct(data);
}

export async function getAllCategoriesAdmin(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("getAllCategoriesAdmin error:", error.message);
    return [];
  }

  return (data ?? []).map(mapCategory);
}
