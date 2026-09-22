"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updateProductPriceQuick } from "@/lib/actions/products";
import { parsePriceInput, toPriceInputValue } from "@/lib/utils";

/**
 * Campo de preço editável que só aparece pro administrador logado, direto
 * nas páginas públicas do site (catálogo, destaques da Home, página do
 * produto). O preço em si continua visível pra todo mundo, normalmente —
 * só quem pode editá-lo ali na hora, sem abrir o painel /admin, é o admin.
 */
export function AdminPriceControl({
  productId,
  price,
}: {
  productId: string;
  price: number | null;
}) {
  const [value, setValue] = useState(() => toPriceInputValue(price));
  const [isPending, startTransition] = useTransition();

  function commit() {
    const parsed = parsePriceInput(value);
    if (parsed === price) return;
    startTransition(async () => {
      await updateProductPriceQuick(productId, parsed);
    });
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-dashed border-brand-gold bg-brand-gold/10 py-1 pl-2.5 pr-1.5">
      <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-brand-brown/70">
        <span className="sm:hidden">Preço</span>
        <span className="hidden sm:inline">Preço · só você edita</span>
      </span>
      <div className="flex items-center gap-1">
        <span className="text-xs text-brand-ink/40">R$</span>
        <input
          type="text"
          inputMode="decimal"
          placeholder="Consultar"
          value={value}
          disabled={isPending}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="w-16 rounded-full border border-transparent bg-white px-1.5 py-0.5 text-xs font-semibold text-brand-ink outline-none hover:border-brand-gold focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
        />
      </div>
      {isPending && <Loader2 className="h-3 w-3 shrink-0 animate-spin text-brand-brown/60" aria-hidden="true" />}
    </div>
  );
}
