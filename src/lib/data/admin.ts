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

const BAIA_SELECT = `*, aves ( sexo, status )`;

/** Número da baia pode ser só dígitos ("1", "23") ou dígitos + letra ("1A",
 * "2A") — as baias aéreas de filhotada, por exemplo. Pra ordenar como uma
 * contagem normal (Baia 1, Baia 2, ..., Baia 30) em vez de ordem de texto
 * (que colocaria "10" antes de "2"), separa o número da letra. */
function parseNumero(numero: string): { numerica: boolean; num: number; sufixo: string } {
  const match = numero.match(/^(\d+)([A-Za-z]*)$/);
  if (!match) return { numerica: false, num: Number.POSITIVE_INFINITY, sufixo: numero };
  const [, digitos, sufixo] = match;
  return { numerica: sufixo === "", num: Number(digitos), sufixo };
}

/** Todas as baias, com a contagem de aves (calculada a partir da tabela
 * `aves`) já embutida — ver mapBaia. Ordenadas pelo número da baia (Baia 1,
 * Baia 2, ...); as baias com letra (1A, 2A...) ficam agrupadas no final,
 * também em ordem, em vez de intercaladas com as numeradas. */
export async function getAllBaiasAdmin(): Promise<Baia[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("baias").select(BAIA_SELECT);

  if (error) {
    console.error("getAllBaiasAdmin error:", error.message);
    return [];
  }

  return (data ?? []).map(mapBaia).sort((a, b) => {
    const pa = parseNumero(a.numero);
    const pb = parseNumero(b.numero);
    if (pa.numerica !== pb.numerica) return pa.numerica ? -1 : 1;
    if (pa.num !== pb.num) return pa.num - pb.num;
    return pa.sufixo.localeCompare(pb.sufixo, "pt-BR");
  });
}

export async function getBaiaByIdAdmin(id: string): Promise<Baia | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("baias")
    .select(BAIA_SELECT)
    .eq("id", id)
    .maybeSingle();
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

// ── Gestão interna: frescor de ovos (envio) ──────────────────────────────
// Regra combinada com o Gabriel (ver 0009_frescor_ovos_perfil.sql):
//   - coletado há até 5 dias -> pode enviar pra qualquer estado do Brasil
//   - coletado há 6 ou 7 dias -> só dá pra garantir envio dentro de SP
//   - depois de 7 dias, o lote sai dessa conta (não conta mais como
//     "fresco o bastante" pra envio, mesmo continuando "Disponível")
// Calculado sempre na hora (sem tarefa agendada) a partir da data de hoje.

export interface OvoFreshnessBuckets {
  qtdAte5: number;
  qtdAte7: number;
}

function diasDesdeColeta(dataPostura: string, hoje: Date): number {
  const data = new Date(`${dataPostura}T00:00:00`);
  return Math.floor((hoje.getTime() - data.getTime()) / 86_400_000);
}

/** Estoque de ovo disponível pra venda, por raça, separado em duas janelas
 * de frescor. Chave do retorno: nome da espécie (lower + trim), pra casar
 * com `products.name` do mesmo jeito que 0006 (fotos) e 0008 (estoque de
 * ave) já fazem. Usada em Produtos/Ovos como coluna informativa — não muda
 * o campo de estoque editável, que continua funcionando como sempre. */
export async function getOvoFreshnessBuckets(): Promise<Record<string, OvoFreshnessBuckets>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lotes_postura")
    .select("quantidade, data_postura, baias ( especie )")
    .eq("destino", "venda")
    .eq("status", "Disponível");

  if (error) {
    console.error("getOvoFreshnessBuckets error:", error.message);
    return {};
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const buckets: Record<string, OvoFreshnessBuckets> = {};

  for (const row of (data ?? []) as {
    quantidade: number;
    data_postura: string;
    baias: { especie: string } | null;
  }[]) {
    const especie = row.baias?.especie;
    if (!especie) continue;

    const key = especie.trim().toLowerCase();
    const dias = diasDesdeColeta(row.data_postura, hoje);
    if (!buckets[key]) buckets[key] = { qtdAte5: 0, qtdAte7: 0 };

    if (dias <= 5) buckets[key].qtdAte5 += row.quantidade;
    else if (dias <= 7) buckets[key].qtdAte7 += row.quantidade;
  }

  return buckets;
}

export interface LoteProximoPrazo {
  id: string;
  baiaNome: string | null;
  especie: string;
  quantidade: number;
  diasColeta: number;
}

/** Lotes de ovos destinados à venda que estão a 6 ou 7 dias da coleta — o
 * prazo de envio garantido (7 dias) está terminando. Usada no aviso dentro
 * do Dashboard (calculado toda vez que a página carrega, sem precisar de
 * nenhuma tarefa agendada nem número de WhatsApp cadastrado). */
export async function getLotesProximoPrazoAdmin(): Promise<LoteProximoPrazo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lotes_postura")
    .select("id, quantidade, data_postura, baias ( nome, especie )")
    .eq("destino", "venda")
    .eq("status", "Disponível");

  if (error) {
    console.error("getLotesProximoPrazoAdmin error:", error.message);
    return [];
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const result: LoteProximoPrazo[] = [];

  for (const row of (data ?? []) as {
    id: string;
    quantidade: number;
    data_postura: string;
    baias: { nome: string; especie: string } | null;
  }[]) {
    const dias = diasDesdeColeta(row.data_postura, hoje);
    if (dias !== 6 && dias !== 7) continue;

    result.push({
      id: row.id,
      baiaNome: row.baias?.nome ?? null,
      especie: row.baias?.especie ?? "",
      quantidade: row.quantidade,
      diasColeta: dias,
    });
  }

  return result.sort((a, b) => b.diasColeta - a.diasColeta);
}
