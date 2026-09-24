import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

function SupabaseNotConfigured() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md rounded-2xl border border-brand-sand/70 bg-white p-8 text-center">
        <h1 className="font-serif text-xl font-semibold text-brand-ink">
          Supabase ainda não configurado
        </h1>
        <p className="mt-3 text-sm text-brand-ink/60">
          Preencha <code className="rounded bg-brand-cream-dark px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
          e <code className="rounded bg-brand-cream-dark px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
          no arquivo <code className="rounded bg-brand-cream-dark px-1.5 py-0.5">.env.local</code> para
          acessar o painel administrativo. Consulte o README do projeto para o passo a passo.
        </p>
      </div>
    </div>
  );
}

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return <SupabaseNotConfigured />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <header className="no-print flex items-center justify-between border-b border-brand-sand/70 bg-white px-4 py-3 sm:px-6 sm:py-4">
          <span className="truncate text-xs text-brand-ink/60 sm:text-sm">
            Conectado como <span className="font-medium text-brand-ink">{user.email}</span>
          </span>
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
