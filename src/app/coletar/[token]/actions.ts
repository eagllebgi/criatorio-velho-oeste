"use server";

import { createClient } from "@/lib/supabase/server";
import type { Destino } from "@/lib/types/domain";

export interface ColetaState {
  error: string | null;
  success: { codigo: string; baiaNome: string } | null;
}

/**
 * Registra uma coleta de ovos a partir do QR Code da baia — sem precisar de
 * login. Só chama a função do banco (coletar_registrar_postura, em
 * 0007_qr_postura.sql), que já valida tudo e replica exatamente a mesma
 * regra do painel (createPostura, em admin/baias/actions.ts): status inicial
 * e previsão de eclosão dependem do destino escolhido.
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
  const quantidade = parseInt(String(formData.get("quantidade") ?? ""), 10);
  const destino = String(formData.get("destino") ?? "venda") as Destino;

  if (!quantidade || quantidade <= 0) {
    return { error: "Informe a quantidade de ovos coletados.", success: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("coletar_registrar_postura", {
      p_qr_token: qrToken,
      p_quantidade: quantidade,
      p_destino: destino,
    })
    .single();

  if (error || !data) {
    return {
      error: error?.message ?? "Não foi possível registrar a coleta. Tente escanear de novo.",
      success: null,
    };
  }

  return { error: null, success: { codigo: data.codigo, baiaNome: data.baia_nome } };
}
