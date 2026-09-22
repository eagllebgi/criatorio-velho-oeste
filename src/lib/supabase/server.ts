import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Database } from "@/lib/types/database";

/**
 * Cliente Supabase para uso em Server Components, Server Actions e Route
 * Handlers. Usa a chave pública (anon key) — respeita as políticas de RLS.
 * A sessão do administrador (quando autenticado) é lida a partir dos cookies.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chamado a partir de um Server Component sem permissão de
            // escrita em cookies. O proxy.ts já cuida de renovar a sessão.
          }
        },
      },
    },
  );
}

/**
 * Usuário administrador logado (ou null, se ninguém estiver logado). Usada
 * nas páginas PÚBLICAS do site pra saber se quem está navegando é o admin —
 * nesse caso ele vê informações extras (como o estoque exato) e controles de
 * edição direto na página, que um cliente comum nunca vê nem consegue usar
 * (o banco recusa qualquer alteração de quem não estiver autenticado, então
 * isso é só uma conveniência de interface, não a camada de segurança).
 *
 * Envolvida em `cache()` pra, dentro da mesma requisição, checar a sessão
 * uma única vez mesmo se várias partes da página (layout, seções, cards)
 * perguntarem "o admin está logado?".
 */
export const getAdminUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
