import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Gera o próximo código sequencial de uma tabela (ex: "B001", "B002", ...),
 * olhando o maior código já usado que comece com o prefixo e somando 1.
 * Simples e suficiente aqui: uso é sempre um clique de cada vez pelo próprio
 * admin, sem cadastro concorrente de múltiplos usuários.
 */
export async function nextCodigo(
  supabase: SupabaseClient<Database>,
  table: "baias" | "lotes_postura",
  prefix: string,
  padLength: number,
): Promise<string> {
  const { data } = await supabase
    .from(table)
    .select("codigo")
    .like("codigo", `${prefix}%`)
    .order("codigo", { ascending: false })
    .limit(1);

  const last = data?.[0]?.codigo as string | undefined;
  const lastNumber = last ? parseInt(last.slice(prefix.length), 10) || 0 : 0;
  const next = lastNumber + 1;

  return `${prefix}${String(next).padStart(padLength, "0")}`;
}
