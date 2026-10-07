"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ConfiguracoesState {
  error: string | null;
  success: boolean;
}

const UF_VALIDA = /^[A-Z]{2}$/;

/** Atualiza a regra de frescor de ovos (dias "nacional", dias "local" e o
 * estado considerado "local") — tabela singleton `configuracoes`, ver
 * 0011_frescor_configuravel.sql. Usada tanto pelas colunas informativas em
 * Produtos/Dashboard quanto pelo aviso no carrinho do site público. */
export async function updateFrescorConfig(
  _prevState: ConfiguracoesState,
  formData: FormData,
): Promise<ConfiguracoesState> {
  const diasNacional = Number(formData.get("dias_frescor_nacional"));
  const diasLocal = Number(formData.get("dias_frescor_local"));
  const ufLocal = String(formData.get("uf_local") ?? "").trim().toUpperCase();

  if (!Number.isFinite(diasNacional) || diasNacional < 0) {
    return { error: "Informe um número de dias válido pro prazo nacional.", success: false };
  }
  if (!Number.isFinite(diasLocal) || diasLocal < diasNacional) {
    return {
      error: "O prazo local precisa ser maior ou igual ao prazo nacional.",
      success: false,
    };
  }
  if (!UF_VALIDA.test(ufLocal)) {
    return { error: "Informe a sigla do estado com 2 letras (ex: SP).", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("configuracoes")
    .update({
      dias_frescor_nacional: diasNacional,
      dias_frescor_local: diasLocal,
      uf_local: ufLocal,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);

  if (error) {
    return { error: error.message, success: false };
  }

  revalidatePath("/admin/configuracoes");
  revalidatePath("/admin/produtos");
  revalidatePath("/admin");
  revalidatePath("/ovos");
  revalidatePath("/ovos/[slug]", "page");

  return { error: null, success: true };
}
