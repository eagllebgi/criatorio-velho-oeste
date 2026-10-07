import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAllBaiasAdmin } from "@/lib/data/admin";
import { generateMestreQrDataUrl } from "@/lib/qrcode";
import { LancamentoMestreForm } from "@/components/admin/LancamentoMestreForm";
import { MestreQrCode } from "@/components/admin/MestreQrCode";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lançamento mestre" };

export default async function LancamentoMestrePage() {
  const [baias, qrDataUrl] = await Promise.all([getAllBaiasAdmin(), generateMestreQrDataUrl()]);

  // Baia Inativa não entra na lista — não faz sentido lançar postura pra uma
  // baia que não está em produção no momento.
  const baiasAtivas = baias.filter((b) => b.status !== "Inativa");

  return (
    <div>
      <Link
        href="/admin/baias"
        className="inline-flex items-center gap-1.5 text-sm text-brand-ink/60 hover:text-brand-green"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Voltar pra Baias
      </Link>

      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-brand-ink">Lançamento mestre</h1>
          <p className="mt-1 text-sm text-brand-ink/60">
            Lance a coleta do dia de todas as baias de uma vez — um número por baia, cada uma
            indo pro destino padrão dela. Pra um destino diferente numa baia específica, use o
            botão &quot;Postura&quot; dela, em Baias.
          </p>
        </div>
        <MestreQrCode dataUrl={qrDataUrl} />
      </div>

      <div className="mt-6 max-w-lg">
        <LancamentoMestreForm
          baias={baiasAtivas.map((b) => ({
            id: b.id,
            nome: b.nome,
            especie: b.especie,
            destinoPadrao: b.destinoPadrao,
          }))}
        />
      </div>
    </div>
  );
}
