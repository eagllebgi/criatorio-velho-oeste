import { createClient } from "@/lib/supabase/server";
import {
  mapAve,
  mapBaia,
  mapBaiaObservacao,
  mapCategory,
  mapFinanceiro,
  mapLotePostura,
  mapProduct,
} from "@/lib/data/mappers";
import type {
  Ave,
  Baia,
  BaiaObservacao,
  Category,
  Financeiro,
  LotePostura,
  Product,
} from "@/lib/types/domain";

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

// ── Gestão interna: financeiro ──────────────────────────────────────────

/** "2026-09" -> uso interno do módulo financeiro. Padrão: mês atual. */
function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Lançamentos de um mês (formato "YYYY-MM"). Sem mês informado, usa o atual. */
export async function getFinanceiroMesAdmin(month?: string): Promise<Financeiro[]> {
  const key = month ?? currentMonthKey();
  const [year, mon] = key.split("-").map(Number);
  const from = `${key}-01`;
  const to = new Date(year, mon, 0).toISOString().split("T")[0]; // último dia do mês

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("financeiro")
    .select("*")
    .gte("data", from)
    .lte("data", to)
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getFinanceiroMesAdmin error:", error.message);
    return [];
  }

  return (data ?? []).map(mapFinanceiro);
}

// ── Gestão interna: baias ────────────────────────────────────────────────

export async function getAllBaiasAdmin(): Promise<Baia[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("baias")
    .select("*")
    .order("numero", { ascending: true });

  if (error) {
    console.error("getAllBaiasAdmin error:", error.message);
    return [];
  }

  return (data ?? []).map(mapBaia);
}

export async function getBaiaByIdAdmin(id: string): Promise<Baia | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("baias").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return mapBaia(data);
}

export async function getObservacoesByBaiaAdmin(baiaId: string): Promise<BaiaObservacao[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("baia_observacoes")
    .select("*")
    .eq("baia_id", baiaId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getObservacoesByBaiaAdmin error:", error.message);
    return [];
  }

  return (data ?? []).map(mapBaiaObservacao);
}

// ── Gestão interna: aves (plantel individual) ────────────────────────────

const AVE_SELECT = `*, baias ( nome )`;

export async function getAllAvesAdmin(): Promise<Ave[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("aves")
    .select(AVE_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAllAvesAdmin error:", error.message);
    return [];
  }

  return (data ?? []).map(mapAve);
}

export async function getAveByIdAdmin(id: string): Promise<Ave | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("aves")
    .select(AVE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapAve(data);
}

// ── Gestão interna: lotes de postura (ovos & chocadeira) ────────────────

const LOTE_SELECT = `*, baias ( nome )`;

export async function getAllLotesPosturaAdmin(): Promise<LotePostura[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lotes_postura")
    .select(LOTE_SELECT)
    .order("data_postura", { ascending: false });

  if (error) {
    console.error("getAllLotesPosturaAdmin error:", error.message);
    return [];
  }

  return (data ?? []).map(mapLotePostura);
}
