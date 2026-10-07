"use client";

import { useState } from "react";
import { QrCode, Download, Loader2 } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { buildQrDownloadImage } from "@/lib/qrImage";

/**
 * QR Code do "lançamento mestre" — escaneando, cai direto em
 * /coletar/mestre (login só na primeira vez por aparelho, mesma conta do
 * painel) com todas as baias ativas listadas pra lançar a coleta do dia
 * inteiro numa tela só. Ao contrário do QR por baia (BaiaQrCode.tsx), não
 * depende de token — é sempre o mesmo QR, não precisa gerar de novo quando
 * uma baia é criada ou excluída.
 */
export function MestreQrCode({ dataUrl }: { dataUrl: string }) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const composedUrl = await buildQrDownloadImage({
        dataUrl,
        title: "Lançamento mestre",
        subtitle: "Escaneie pra lançar a coleta do dia",
      });
      const a = document.createElement("a");
      a.href = composedUrl;
      a.download = "qr-lancamento-mestre.png";
      a.click();
    } catch {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "qr-lancamento-mestre.png";
      a.click();
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-sand bg-white px-4 py-2.5 text-sm font-medium text-brand-ink/70 hover:border-brand-green hover:text-brand-green"
      >
        <QrCode className="h-4 w-4" aria-hidden="true" />
        QR Mestre
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="QR Code — Lançamento mestre">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-brand-ink/60">
            Imprima e cole num lugar fixo (ex: na entrada do galinheiro). Escaneando, cai direto
            nessa tela de lançamento — com todas as baias já listadas, sem precisar abrir o painel
            completo nem escanear uma por uma.
          </p>

          <div className="rounded-2xl border border-brand-sand bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dataUrl} alt="QR Code — Lançamento mestre" width={240} height={240} />
          </div>

          <button
            type="button"
            disabled={downloading}
            onClick={handleDownload}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-brand-sand px-4 py-2.5 text-sm font-medium text-brand-ink/70 hover:border-brand-green hover:text-brand-green disabled:opacity-60"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="h-4 w-4" aria-hidden="true" />
            )}
            Baixar
          </button>
          <p className="text-xs text-brand-ink/40">
            Mesmo login do painel admin — pede senha só na primeira vez em cada aparelho. Não
            precisa reimprimir quando criar ou excluir uma baia: é sempre o mesmo QR.
          </p>
        </div>
      </Sheet>
    </>
  );
}
