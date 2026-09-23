import { unstable_rethrow } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { mapCategory, mapProduct } from "@/lib/data/mappers";
import type { Category, Product, ProductType } from "@/lib/types/domain";

const PRODUCT_SELECT = `
  *,
  categories ( name, slug ),
  product_images ( image_url, display_order )
`;

/**
 * O catálogo público nunca deve derrubar a página por causa do Supabase
 * (credenciais ainda não configuradas, projeto fora do ar, etc). Qualquer
 * falha aqui é tratada como "sem dados", nunca como erro fatal.
 */
async function safeQuery<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (err) {
    unstable_rethrow(err);
    console.error(`${label} error:`, err instanceof Error ? err.message : err);
    return fallback;
  }
}

/** Produtos ativos, para as páginas /ovos e /aves. Sem "type", traz os dois. */
export async function getActiveProducts(type?: ProductType): Promise<Product[]> {
  return safeQuery(
    "getActiveProducts",
    async () => {
      const supabase = await createClient();
      let query = supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("active", true)
        .order("display_order", { ascending: true });

      if (type) query = query.eq("product_type", type);

      const { data, error } = await query;

      if (error) throw error;
      return (data ?? []).map(mapProduct);
    },
    [],
  );
}

/** Produtos ativos, em estoque e marcados como destaque, para a Home. */
export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  return safeQuery(
    "getFeaturedProducts",
    async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("active", true)
        .eq("featured", true)
        .gt("stock", 0)
        .order("display_order", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return (data ?? []).map(mapProduct);
    },
    [],
  );
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return safeQuery(
    "getProductBySlug",
    async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle();

      if (error || !data) return null;
      return mapProduct(data);
    },
    null,
  );
}

export async function getActiveCategories(): Promise<Category[]> {
  return safeQuery(
    "getActiveCategories",
    async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return (data ?? []).map(mapCategory);
    },
    [],
  );
}
