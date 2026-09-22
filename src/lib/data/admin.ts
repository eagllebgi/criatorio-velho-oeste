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
  const { data, error } = await supabase.from("products").select(PRODUCT_SELECT);

  if (error) {
    console.error("getAllProductsAdmin error:", error.message);
    return [];
  }

  const products = (data ?? []).map(mapProduct);

  // Lista do admin: ativos primeiro, depois inativos; dentro de cada grupo,
  // ordem alfabética pelo nome (usando localeCompare "pt-BR" pra acentos
  // ficarem na posição certa).
  return products.sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.name.localeCompare(b.name, "pt-BR") || a.displayOrder - b.displayOrder;
  });
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
