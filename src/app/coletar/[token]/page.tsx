import { TriangleAlert } from "lucide-react";
import { createClient, getAdminUser } from "@/lib/supabase/server";
import { LoginForm } from "@/components/admin/LoginForm";
import { ColetarForm } from "./ColetarForm";

export default async function ColetarPage(props: PageProps<"/coletar/[token]">) {
  const { token } = await props.params;

  // Só quem está logado (mesma conta do painel admin) consegue registrar
  // coleta — evita que qualquer pessoa que ache o QR Code físico saia
  // lançando dados aleatórios. Login é feito só uma vez por aparelho: a
  // sessão do Supabase fica salva no navegador, então nos próximos QR Codes
  // escaneados (mesmo celular) já entra direto, sem pedir de novo.
  const user = await getAdminUser();

  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <h1 className="font-serif text-2xl font-semibold text-brand-ink">
              Entrar para coletar
            </h1>
            <p className="mt-1.5 text-sm text-brand-ink/60">
              Use o mesmo login do painel administrativo. Só precisa fazer isso uma vez nesse
              aparelho.
            </p>
          </div>
          <div className="rounded-2xl border border-brand-sand bg-white p-5">
            <LoginForm redirectTo={`/coletar/${token}`} />
          </div>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("coletar_baia_info", { p_qr_token: token })
    .maybeSingle();

  // Cobre tanto um token com formato inválido (erro do Postgres ao tentar
  // converter pra uuid) quanto um token que não existe mais — por exemplo,
  // um QR de uma baia que foi excluída. A mesma tela cobre os dois casos.
  if (error || !data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <TriangleAlert className="h-10 w-10 text-brand-gold" aria-hidden="true" />
        <h1 className="font-serif text-xl font-semibold text-brand-ink">QR Code inválido</h1>
        <p className="max-w-xs text-sm text-brand-ink/60">
          Não encontramos nenhuma baia pra esse código. Se essa baia foi excluída ou substituída,
          peça pra reimprimir o QR Code dela no painel.
        </p>
      </div>
    );
  }

  return (
    <ColetarForm
      token={token}
      nome={data.nome}
      especie={data.especie}
      destinoPadrao={data.destino_padrao}
    />
  );
}
