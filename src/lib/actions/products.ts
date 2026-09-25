"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Ações de edição rápida de produto, compartilhadas entre a edição rápida do
 * painel admin (/admin/produtos) e a edição direto nas páginas públicas do
 * site (quando o administrador está navegando logado — ver AdminStockControl
 * e AdminPriceControl).
 *
 * A checagem de sessão abaixo é só uma segunda camada: a política de
 * segurança do banco (RLS, em supabase/migrations/0001_init.sql) já recusa
 * qualquer escrita de quem não estiver autenticado, então mesmo sem essa
 * checagem a ação seria inofensiva se chamada por alguém de fora.
 */
async function requireAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? null : "Não autorizado.";
}

function revalidateProductPaths() {
  revalidatePath("/admin/produtos");
  revalidatePath("/admin");
  revalidatePath("/ovos");
  revalidatePath("/ovos/[slug]", "page");
  revalidatePath("/aves");
  revalidatePath("/aves/[slug]", "page");
  revalidatePath("/");
}

export async function updateProductStockQuick(
  productId: string,
  stock: number,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const authError = await requireAdmin(supabase);
  if (authError) return { error: authError };

  // Estoque de raça "Ave" é calculado sozinho a partir do Plantel (ver
  // 0008_postura_login_ave_stock.sql) — não dá pra editar direto. A UI já
  // deixa o campo desabilitado/somente-leitura pra esse tipo (ProductForm,
  // StockCell); essa checagem aqui é só a segunda camada de segurança,
  // igual ao padrão do requireAdmin acima.
  const { data: product } = await supabase
    .from("products")
    .select("product_type")
    .eq("id", productId)
    .maybeSingle();
  if (product?.product_type === "ave") {
    return { error: "Estoque de Ave é calculado automaticamente pelo Plantel." };
  }

  const { error } = await supabase
    .from("products")
    .update({ stock: Math.max(0, stock) })
    .eq("id", productId);

  if (error) return { error: error.message };

  revalidateProductPaths();
  return { error: null };
}

export async function updateProductPriceQuick(
  productId: string,
  price: number | null,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const authError = await requireAdmin(supabase);
  if (authError) return { error: authError };

  const { error } = await supabase
    .from("products")
    .update({ price: price !== null && price >= 0 ? price : null })
    .eq("id", productId);

  if (error) return { error: error.message };

  revalidateProductPaths();
  return { error: null };
}
