import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAllBaiasAdmin } from "@/lib/data/admin";
import { generateColetaQrDataUrl } from "@/lib/qrcode";
import { PrintButton } from "@/components/admin/PrintButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "QR Codes das baias" };

export default async function BaiasQrCodesPage() {
  const baias = await getAllBaiasAdmin();
  const qrs = await Promise.all(
    baias.map(async (baia) => ({
      id: baia.id,
      nome: baia.nome,
      codigo: baia.codigo,
      especie: baia.especie,
      dataUrl: await generateColetaQrDataUrl(baia.qrToken),
    })),
  );

  return (
    <div>
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/baias"
            className="inline-flex items-center gap-1.5 text-sm text-brand-ink/60 hover:text-brand-green"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Voltar pra Baias
          </Link>
          <h1 className="mt-2 font-serif text-2xl font-semibold text-brand-ink">
            QR Codes das baias
          </h1>
          <p className="mt-1 text-sm text-brand-ink/60">
            Imprima e recorte um pra cada baia — cole na frente dela. Escaneando, o camponês cai
            direto na tela de coleta de ovos daquela baia (login só na primeira vez).
          </p>
        </div>
        <PrintButton />
      </div>

      {baias.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-brand-sand bg-white p-10 text-center text-sm text-brand-ink/60">
          Nenhuma baia cadastrada ainda.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-3 print:gap-3">
          {qrs.map((qr) => (
            <div
              key={qr.id}
              className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-brand-sand bg-white p-4 text-center break-inside-avoid print:rounded-none print:border-brand-ink/30"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr.dataUrl} alt={`QR Code — ${qr.nome}`} width={180} height={180} />
              {/* Nome por extenso em destaque — facilita conferir qual QR é
                  de qual baia na hora de recortar e colar cada um. */}
              <div>
                <p className="text-base font-semibold text-brand-ink">{qr.nome}</p>
                <p className="text-sm text-brand-ink/50">
                  {qr.especie} · {qr.codigo}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
