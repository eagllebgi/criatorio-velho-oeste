"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { PREVIEW_VISITOR_COOKIE } from "@/lib/supabase/server";

/**
 * Liga/desliga o "Ver como visitante" (ver AdminPreviewBar.tsx). Não mexe na
 * sessão do Supabase Auth — é só um cookie que faz as páginas públicas
 * mostrarem pro admin exatamente o que um cliente comum vê. Chamada direto
 * (sem formulário) pelo botão da barra, dentro de um useTransition.
 */
export async function setPreviewMode(enabled: boolean) {
  const cookieStore = await cookies();

  if (enabled) {
    // Cookie de sessão (sem maxAge): se o admin fechar o navegador sem
    // clicar em "Voltar pra visão admin", na próxima visita já volta sozinho
    // pra visão admin normal, sem ficar "preso" no modo visitante.
    cookieStore.set(PREVIEW_VISITOR_COOKIE, "1", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  } else {
    cookieStore.delete(PREVIEW_VISITOR_COOKIE);
  }

  // Revalida as páginas públicas pra re-renderizarem já considerando o novo
  // valor do cookie (mesma lista de rotas usada quando um produto muda).
  revalidatePath("/");
  revalidatePath("/ovos");
  revalidatePath("/ovos/[slug]", "page");
  revalidatePath("/aves");
  revalidatePath("/aves/[slug]", "page");
}
