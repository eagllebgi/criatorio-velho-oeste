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

/** Venda rápida atrelada a um produto do catálogo (ovo ou ave): gera a
 * descrição sozinha (ex: "3 Ovos de Angola", "1 unidade de Ave Legbar"),
 * lança a entrada no financeiro e já desconta do estoque — sem precisar abrir
 * o cadastro de produtos pra fazer as duas coisas separado. */
export async function createVendaRapida(
  _prevState: FinanceiroFormState,
  formData: FormData,
): Promise<FinanceiroFormState> {
  const productId = String(formData.get("productId") ?? "").trim();
  const quantidade = Number(formData.get("quantidade"));
  const precoUnit = parsePriceInput(String(formData.get("precoUnit") ?? ""));
  const data = String(formData.get("data") ?? "").trim() || undefined;

  if (!productId) return { error: "Selecione um produto." };
  if (!Number.isFinite(quantidade) || quantidade <= 0) {
    return { error: "Informe a quantidade." };
  }
  if (precoUnit === null || precoUnit < 0) return { error: "Informe um preço válido." };

  const supabase = await createClient();
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("id, name, stock, product_type")
    .eq("id", productId)
    .maybeSingle();

  if (fetchError || !product) return { error: "Produto não encontrado." };
  if (quantidade > product.stock) {
    return { error: `Só há ${product.stock} em estoque.` };
  }

  const { error: stockError } = await supabase
    .from("products")
    .update({ stock: product.stock - quantidade })
    .eq("id", productId);
  if (stockError) return { error: stockError.message };

  const isAve = product.product_type === "ave";
  const descricao = isAve
    ? `${quantidade} ${quantidade === 1 ? "unidade" : "unidades"} de Ave ${product.name}`
    : `${quantidade} ${quantidade === 1 ? "Ovo" : "Ovos"} de ${product.name}`;

  const { error: insertError } = await supabase.from("financeiro").insert({
    tipo: "entrada",
    descricao,
    categoria: "Venda de produto",
    valor: quantidade * precoUnit,
    ...(data ? { data } : {}),
  });
  if (insertError) return { error: insertError.message };

  revalidateFinanceiroPaths();
  revalidatePath("/admin/produtos");
  revalidatePath("/ovos");
  revalidatePath("/ovos/[slug]", "page");
  revalidatePath("/aves");
  revalidatePath("/aves/[slug]", "page");
  revalidatePath("/");
  return { error: null };
}
