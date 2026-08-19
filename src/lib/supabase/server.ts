import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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
