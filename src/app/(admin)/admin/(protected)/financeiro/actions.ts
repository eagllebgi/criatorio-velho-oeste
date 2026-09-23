"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parsePriceInput } from "@/lib/utils";

export interface FinanceiroFormState {
  error: string | null;
}

function revalidateFinanceiroPaths() {
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin");
}

export async function createTransacao(
  _prevState: FinanceiroFormState,
  formData: FormData,
): Promise<FinanceiroFormState> {
  const tipo = String(formData.get("tipo") ?? "entrada");
  const descricao = String(formData.get("descricao") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim() || null;
  const valor = parsePriceInput(String(formData.get("valor") ?? ""));
  const data = String(formData.get("data") ?? "").trim() || undefined;

  if (tipo !== "entrada" && tipo !== "saida") {
    return { error: "Tipo de lançamento inválido." };
  }
  if (!descricao) return { error: "Descreva o lançamento." };
  if (valor === null || valor <= 0) return { error: "Informe um valor válido." };

  const supabase = await createClient();
  const { error } = await supabase.from("financeiro").insert({
    tipo,
    descricao,
    categoria,
    valor,
    ...(data ? { data } : {}),
  });

  if (error) return { error: error.message };

  revalidateFinanceiroPaths();
  return { error: null };
}

export async function deleteTransacao(id: string) {
  const supabase = await createClient();
  await supabase.from("financeiro").delete().eq("id", id);
  revalidateFinanceiroPaths();
}
