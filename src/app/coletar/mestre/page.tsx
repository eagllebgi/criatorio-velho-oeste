import { TriangleAlert } from "lucide-react";
import { getAdminUser } from "@/lib/supabase/server";
import { getAllBaiasAdmin } from "@/lib/data/admin";
import { LoginForm } from "@/components/admin/LoginForm";
import { LancamentoMestreForm } from "@/components/admin/LancamentoMestreForm";

export const dynamic = "force-dynamic";

/**
 * Tela do QR Code mestre (/coletar/mestre) — mesma ideia do /coletar/[token]
 * (login só uma vez por aparelho, visual simples pro celular), só que em vez
 * de uma baia só, lista todas de uma vez: um número de ovos por baia, pra
 * fechar a coleta do dia inteiro numa confirmação só. Usa o mesmo
 * componente de formulário de /admin/baias/lancamento (LancamentoMestreForm)
 * e a mesma ação do servidor (createLancamentoMestre) — os dois caminhos
 * nunca ficam dessincronizados.
 */
export default async function ColetarMestrePage() {
  // Mesma regra do /coletar/[token]: só quem está logado (mesma conta do
  // painel admin) consegue lançar — evita que qualquer pessoa que ache o QR
  // físico saia lançando dados aleatórios.
  const user = await getAdminUser();

  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <h1 className="font-serif text-2xl font-semibold text-brand-ink">Entrar para lançar</h1>
            <p className="mt-1.5 text-sm text-brand-ink/60">
              Use o mesmo login do painel administrativo. Só precisa fazer isso uma vez nesse
              aparelho.
            </p>
          </div>
          <div className="rounded-2xl border border-brand-sand bg-white p-5">
            <LoginForm redirectTo="/coletar/mestre" />
          </div>
        </div>
      </div>
    );
  }

  const baias = (await getAllBaiasAdmin()).filter((b) => b.status !== "Inativa");

  return (
    <div className="flex-1 px-5 py-8">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="text-4xl" aria-hidden="true">
            🥚
          </span>
          <h1 className="mt-2 font-serif text-2xl font-semibold text-brand-ink">
            Lançamento mestre
          </h1>
          <p className="text-sm text-brand-ink/50">Quantos ovos em cada baia hoje?</p>
        </div>

        {baias.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-brand-sand bg-white p-6 text-center">
            <TriangleAlert className="h-8 w-8 text-brand-gold" aria-hidden="true" />
            <p className="text-sm text-brand-ink/60">Nenhuma baia ativa cadastrada ainda.</p>
          </div>
        ) : (
          <LancamentoMestreForm
            baias={baias.map((b) => ({
              id: b.id,
              nome: b.nome,
              especie: b.especie,
              destinoPadrao: b.destinoPadrao,
            }))}
          />
        )}
      </div>
    </div>
  );
}
