"use client";

import { useState } from "react";
import { QrCode, Download, Printer, Loader2 } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { buildQrDownloadImage } from "@/lib/qrImage";

/**
 * QR Code de coleta de ovos, num cantinho do card da baia — clica e abre o
 * QR grande pra imprimir e colar na frente da baia. Escaneando ele, o
 * camponês cai direto na tela de coleta daquela baia (/coletar/<token>) —
 * precisa logar com a mesma conta do painel na primeira vez (veja
 * supabase/migrations/0008_postura_login_ave_stock.sql), depois disso o
 * aparelho continua logado pros próximos QR Codes.
 *
 * O PNG (dataUrl) já vem pronto do servidor (gerado em page.tsx com a lib
 * "qrcode") — o componente só exibe, não gera nada no navegador.
 */
export function BaiaQrCode({
  nome,
  codigo,
  especie,
  dataUrl,
  className,
}: {
  nome: string;
  codigo: string;
  especie: string;
  dataUrl: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const composedUrl = await buildQrDownloadImage({
        dataUrl,
        title: nome,
        subtitle: `${especie} · ${codigo}`,
      });
      const a = document.createElement("a");
      a.href = composedUrl;
      a.download = `qr-${codigo.toLowerCase()}.png`;
      a.click();
    } catch {
      // Se por algum motivo o canvas falhar (ex: navegador muito antigo),
      // ainda baixa o QR puro — melhor que não baixar nada.
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `qr-${codigo.toLowerCase()}.png`;
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
        title="Ver QR Code de coleta"
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full border border-brand-sand bg-white text-brand-ink/60 shadow-sm hover:border-brand-green hover:text-brand-green",
          className,
        )}
      >
        <QrCode className="h-4 w-4" aria-hidden="true" />
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title={`QR Code — ${nome}`}>
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-brand-ink/60">Imprima e Cole na Frente da Baia</p>

          <div className="rounded-2xl border border-brand-sand bg-white p-4">
            {/* Vem pronto do servidor como PNG (data URI) — <img> puro é o
                jeito certo aqui, next/image não traz vantagem nenhuma pra
                uma imagem gerada, pequena e que nunca muda de tamanho. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dataUrl} alt={`QR Code de coleta — ${nome}`} width={240} height={240} />
          </div>

          {/* Nome por extenso bem visível embaixo do QR — ajuda a conferir
              qual é qual na hora de colar cada um na baia certa. */}
          <div>
            <p className="text-lg font-semibold text-brand-ink">{nome}</p>
            <p className="text-sm text-brand-ink/50">
              {especie} · {codigo}
            </p>
          </div>

          <div className="flex w-full gap-2">
            <button
              type="button"
              disabled={downloading}
              onClick={handleDownload}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-brand-sand px-4 py-2.5 text-sm font-medium text-brand-ink/70 hover:border-brand-green hover:text-brand-green disabled:opacity-60"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4" aria-hidden="true" />
              )}
              Baixar
            </button>
            <Button href="/admin/baias/qrcodes" variant="outline" className="flex-1">
              <Printer className="h-4 w-4" aria-hidden="true" />
              Imprimir todos
            </Button>
          </div>
          <p className="text-xs text-brand-ink/40">
            O arquivo baixado já vem com o nome da baia escrito embaixo do QR — dá pra reconhecer
            qual é qual antes mesmo de escanear.
          </p>
        </div>
      </Sheet>
    </>
  );
}
