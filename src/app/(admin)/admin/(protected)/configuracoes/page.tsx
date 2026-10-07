import { getFrescorConfigAdmin } from "@/lib/data/admin";
import { ConfiguracoesForm } from "@/components/admin/ConfiguracoesForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  const frescorConfig = await getFrescorConfigAdmin();

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-brand-ink">Configurações</h1>
      <p className="mt-1 text-sm text-brand-ink/60">
        Ajustes gerais do site que não mudam com frequência.
      </p>

      <div className="mt-6">
        <ConfiguracoesForm frescorConfig={frescorConfig} />
      </div>
    </div>
  );
}
