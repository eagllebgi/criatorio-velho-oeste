"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Galeria de fotos da página de produto: imagem principal grande + miniaturas
 * clicáveis abaixo (quando o produto tem mais de uma foto). Antes, a página
 * só mostrava a foto principal — as demais fotos enviadas pelo admin ficavam
 * salvas mas nunca apareciam para o visitante.
 */
export function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? null;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-brand-sand">
        {current ? (
          <Image
            src={current}
            alt={alt}
            fill
            sizes="(min-width: 1024px) 45vw, 90vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-brand-brown/30">
            <ImageOff className="h-10 w-10" aria-hidden="true" />
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={`${img}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ver foto ${i + 1} de ${alt}`}
              aria-pressed={active === i}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-opacity",
                active === i
                  ? "border-brand-gold"
                  : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <Image src={img} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
