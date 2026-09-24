"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { Check, X, ZoomIn } from "lucide-react";

const FRAME_MAX_WIDTH = 320;
/** Resolução final do recorte = largura do quadro × esse fator — dá uma
 * imagem nítida sem ficar gigante (uns 800px de largura pra um quadro
 * quadrado, por exemplo). */
const RESOLUTION_FACTOR = 2.5;

interface ImageCropModalProps {
  file: File;
  /** Proporção largura/altura do quadro de recorte — 1 pra quadrado/círculo
   * (avatares, miniaturas), 4/3 pra foto principal do produto. Deve bater
   * com o formato de onde a foto vai aparecer no site. */
  aspect: number;
  title?: string;
  onCancel: () => void;
  onCropped: (blob: Blob) => void;
}

/**
 * Editor de recorte reutilizado em todo ponto do site onde o admin envia uma
 * foto (raça em Produtos, ave e baia no plantel/gestão). Carrega a imagem
 * escolhida, deixa arrastar pra posicionar e um slider pra dar zoom dentro de
 * um quadro do formato certo pro campo de destino, e devolve só o recorte
 * final (um Blob JPEG) — o componente que chamou continua responsável por
 * subir esse Blob pro Storage do jeito que já fazia com o arquivo original.
 */
export function ImageCropModal({ file, aspect, title = "Ajustar foto", onCancel, onCropped }: ImageCropModalProps) {
  const [mounted, setMounted] = useState(false);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const [processing, setProcessing] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startLeft: number; startTop: number } | null>(null);

  const frameW = FRAME_MAX_WIDTH;
  const frameH = FRAME_MAX_WIDTH / aspect;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Carrega o arquivo escolhido num <img> em memória só pra saber o tamanho
  // natural — necessário pro cálculo de escala/recorte abaixo.
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => setImgEl(img);
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const baseScale = useMemo(() => {
    if (!imgEl) return 1;
    return Math.max(frameW / imgEl.naturalWidth, frameH / imgEl.naturalHeight);
  }, [imgEl, frameW, frameH]);

  const displayScale = baseScale * zoom;
  const dW = imgEl ? imgEl.naturalWidth * displayScale : 0;
  const dH = imgEl ? imgEl.naturalHeight * displayScale : 0;

  // Recentraliza sempre que a imagem carrega ou o zoom muda — mantém o
  // comportamento simples e previsível em vez de tentar preservar a posição
  // relativa proporcionalmente a cada mudança de zoom.
  useEffect(() => {
    if (!imgEl) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPos({ left: (frameW - dW) / 2, top: (frameH - dH) / 2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgEl, zoom]);

  function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
  }

  function handlePointerDown(e: PointerEvent) {
    if (!imgEl) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startLeft: pos.left, startTop: pos.top };
  }

  function handlePointerMove(e: PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const minLeft = frameW - dW;
    const minTop = frameH - dH;
    setPos({
      left: clamp(dragRef.current.startLeft + dx, minLeft, 0),
      top: clamp(dragRef.current.startTop + dy, minTop, 0),
    });
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function handleConfirm() {
    if (!imgEl) return;
    setProcessing(true);

    const targetW = Math.round(frameW * RESOLUTION_FACTOR);
    const targetH = Math.round(targetW / aspect);
    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setProcessing(false);
      return;
    }

    // Fundo branco antes de desenhar: sem isso, uma foto com transparência
    // (ex: PNG com fundo transparente) sai com fundo PRETO no recorte final,
    // porque o JPEG não tem canal alfa e o canvas nasce transparente/preto.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, targetW, targetH);

    const sourceX = -pos.left / displayScale;
    const sourceY = -pos.top / displayScale;
    const sourceW = frameW / displayScale;
    const sourceH = frameH / displayScale;
    ctx.drawImage(imgEl, sourceX, sourceY, sourceW, sourceH, 0, 0, targetW, targetH);

    canvas.toBlob(
      (blob) => {
        setProcessing(false);
        if (blob) onCropped(blob);
      },
      "image/jpeg",
      0.9,
    );
  }

  if (!mounted) return null;

  const content = (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cancelar"
        onClick={onCancel}
        className="absolute inset-0 bg-brand-ink/60 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-sm rounded-2xl bg-brand-cream p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-base font-semibold text-brand-ink">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancelar"
            className="flex h-8 w-8 items-center justify-center rounded-full text-brand-ink/60 hover:bg-brand-ink/5"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-1 text-xs text-brand-ink/50">
          Arraste pra posicionar e use o zoom pra ajustar o enquadramento.
        </p>

        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative mx-auto mt-4 touch-none select-none overflow-hidden rounded-xl bg-brand-sand"
          style={{ width: frameW, height: frameH, cursor: imgEl ? "grab" : "default" }}
        >
          {imgEl && (
            // Recorte interativo: precisa de controle manual de posição/escala
            // via style, o que o next/image não permite — <img> puro é o jeito
            // certo aqui, é só um preview em memória, nunca é servido pelo site.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgEl.src}
              alt=""
              draggable={false}
              style={{ position: "absolute", left: pos.left, top: pos.top, width: dW, height: dH, maxWidth: "none" }}
            />
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <ZoomIn className="h-4 w-4 shrink-0 text-brand-ink/40" aria-hidden="true" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-brand-green"
            aria-label="Zoom"
          />
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-brand-sand px-4 py-2.5 text-sm font-medium text-brand-ink/70 hover:border-brand-green/50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!imgEl || processing}
            onClick={handleConfirm}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brand-green px-4 py-2.5 text-sm font-medium text-brand-cream hover:bg-brand-green-dark disabled:opacity-60"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            {processing ? "Processando..." : "Usar foto"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
