"use server";

import { createClient } from "@/lib/supabase/server";
import type { Destino } from "@/lib/types/domain";
import type { Json } from "@/lib/types/database";

export interface ColetaItem {
  destino: Destino;
  quantidade: number;
}

export interface ColetaState {
  error: string | null;
  success: { codigos: string[]; baiaNome: string } | null;
}

/**
 * Registra uma ou mais coletas de ovos a partir do QR Code da baia — a
 * quantidade pode ir pra destinos diferentes numa única confirmação (ex:
 * "10 pra chocadeira, 20 pra venda"), igual ao formulário de postura do
 * painel (createPostura, em admin/baias/actions.ts). A função do banco
 * (coletar_registrar_postura, em 0008_postura_login_ave_stock.sql) já
 * valida tudo e replica exatamente a mesma regra: status inicial e previsão
 * de eclosão dependem do destino de cada item.
 *
 * Só funciona logado — a página (page.tsx) já garante isso antes de mostrar
 * o formulário, e a própria função do banco só aceita chamadas autenticadas
 * (o RPC não tem mais grant pro papel "anon").
 *
 * "qrToken" vem "amarrado" via .bind no client component — por isso a
 * assinatura (qrToken primeiro, depois prevState/formData) bate com o que
 * useActionState espera.
 */
export async function registrarColeta(
  qrToken: string,
  _prevState: ColetaState,
  formData: FormData,
): Promise<ColetaState> {
  let itens: ColetaItem[];
  try {
    itens = JSON.parse(String(formData.get("itens") ?? "[]"));
  } catch {
    return { error: "Não foi possível ler as quantidades informadas.", success: null };
  }

  if (!Array.isArray(itens) || itens.length === 0) {
    return { error: "Informe a quantidade de ovos.", success: null };
  }
  for (const item of itens) {
    if (!item.quantidade || item.quantidade <= 0) {
      return { error: "Informe a quantidade de ovos em cada destino.", success: null };
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("coletar_registrar_postura", {
      p_qr_token: qrToken,
      // O tipo Json não modela interfaces com campos fixos — os itens já
      // foram validados logo acima, então o cast aqui é seguro.
      p_itens: itens as unknown as Json,
    })
    .single();

  if (error || !data) {
    return {
      error: error?.message ?? "Não foi possível registrar a coleta. Tente de novo.",
      success: null,
    };
  }

  return { error: null, success: { codigos: data.codigos, baiaNome: data.baia_nome } };
}
