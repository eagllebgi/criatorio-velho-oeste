"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Atualiza o estoque de um produto. Compartilhada entre a edição rápida do
 * painel admin (/admin/produtos) e a edição direto nas páginas públicas do
 * site (quando o administrador está navegando logado — ver AdminStockControl).
 *
 * A checagem de sessão abaixo é só uma segunda camada: a política de
 * segurança do banco (RLS, em supabase/migrations/0001_init.sql) já recusa
 * qualquer escrita de quem não estiver autenticado, então mesmo sem essa
 * checagem a ação seria inofensiva se chamada por alguém de fora.
 */
export async function updateProductStockQuick(
  productId: string,
  stock: number,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autorizado." };

  const { error } = await supabase
    .from("products")
    .update({ stock: Math.max(0, stock) })
    .eq("id", productId);

  if (error) return { error: error.message };

  revalidatePath("/admin/produtos");
  revalidatePath("/admin/estoque");
  revalidatePath("/admin");
  revalidatePath("/ovos");
  revalidatePath("/ovos/[slug]", "page");
  revalidatePath("/");
  return { error: null };
}
