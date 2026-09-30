import { getAdminUser } from "@/lib/supabase/server";
import { PerfilForm } from "@/components/admin/PerfilForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Perfil" };

export default async function PerfilPage() {
  const user = await getAdminUser();
  const telefone = typeof user?.user_metadata?.telefone === "string" ? user.user_metadata.telefone : "";

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-brand-ink">Perfil</h1>
      <p className="mt-1 text-sm text-brand-ink/60">
        Dados da sua conta de administrador: e-mail, senha e telefone.
      </p>

      <div className="mt-6">
        <PerfilForm email={user?.email ?? ""} telefone={telefone} />
      </div>
    </div>
  );
}
