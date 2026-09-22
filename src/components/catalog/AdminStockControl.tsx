"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updateProductStockQuick } from "@/lib/actions/products";

/**
 * Controle de estoque que só aparece pro administrador logado, direto nas
 * páginas públicas do site (catálogo, destaques da Home, página do produto).
 * Um cliente comum nunca vê isso — nem a quantidade exata, nem o controle.
 *
 * Serve pra poder ajustar o estoque na hora, olhando a página real, sem
 * precisar abrir o painel /admin em outra aba.
 */
export function AdminStockControl({
  productId,
  stock,
}: {
  productId: string;
  stock: number;
}) {
  const [value, setValue] = useState(stock);
  const [isPending, startTransition] = useTransition();

  function commit(next: number) {
    const safe = Math.max(0, next);
    setValue(safe);
    if (safe === stock) return;
    startTransition(async () => {
      await updateProductStockQuick(productId, safe);
    });
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-dashed border-brand-gold bg-brand-gold/10 py-1 pl-2.5 pr-1.5">
      <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-brand-brown/70">
        <span className="sm:hidden">Estoque</span>
        <span className="hidden sm:inline">Estoque · só você vê</span>
      </span>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => commit(value - 1)}
          disabled={isPending || value <= 0}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-brand-brown-dark hover:bg-brand-gold/30 disabled:opacity-30"
          aria-label="Diminuir estoque"
        >
          −
        </button>
        <span className="min-w-5 text-center text-xs font-semibold text-brand-ink" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          onClick={() => commit(value + 1)}
          disabled={isPending}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-brand-brown-dark hover:bg-brand-gold/30 disabled:opacity-30"
          aria-label="Aumentar estoque"
        >
          +
        </button>
      </div>
      {isPending && <Loader2 className="h-3 w-3 shrink-0 animate-spin text-brand-brown/60" aria-hidden="true" />}
    </div>
  );
}
