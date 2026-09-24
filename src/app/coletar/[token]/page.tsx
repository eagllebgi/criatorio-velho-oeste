import { TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ColetarForm } from "./ColetarForm";

export default async function ColetarPage(props: PageProps<"/coletar/[token]">) {
  const { token } = await props.params;

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
