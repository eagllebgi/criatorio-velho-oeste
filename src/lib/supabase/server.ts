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

/** Nome do cookie do "Ver como visitante" (ver AdminPreviewBar.tsx e
 * @/lib/actions/preview.ts) — cookie simples, fora do Supabase Auth: a
 * sessão do admin continua logada o tempo todo, isso só muda o que as
 * páginas públicas MOSTRAM pra ele. */
export const PREVIEW_VISITOR_COOKIE = "cv_preview_visitor";

/** true quando o admin logado ativou "Ver como visitante" — só tem efeito
 * em quem realmente está logado (ver getEffectiveAdminUser abaixo); num
 * visitante comum esse cookie não muda nada, porque ele já não é admin. */
export async function isPreviewingAsVisitor(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(PREVIEW_VISITOR_COOKIE)?.value === "1";
}

/**
 * Usada nas páginas PÚBLICAS no lugar de getAdminUser() direto: devolve o
 * mesmo usuário admin, exceto quando "Ver como visitante" está ativo — nesse
 * caso devolve null, fazendo a página renderizar exatamente como um cliente
 * comum veria (sem estoque exato, sem controles de edição), mesmo com o
 * admin de verdade logado. É só uma troca de visual: o banco continua
 * recusando qualquer escrita de quem não estiver autenticado de verdade, tal
 * qual getAdminUser já documentava.
 */
export const getEffectiveAdminUser = cache(async () => {
  const user = await getAdminUser();
  if (!user) return null;
  if (await isPreviewingAsVisitor()) return null;
  return user;
});
