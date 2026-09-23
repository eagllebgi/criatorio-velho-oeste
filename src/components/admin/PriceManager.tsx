"use client";

import { useMemo, useState, useTransition } from "react";
import { Check } from "lucide-react";
import type { Product } from "@/lib/types/domain";
import { formatBRL } from "@/lib/utils";
import { bulkUpdatePrice } from "@/app/(admin)/admin/(protected)/precos/actions";

function parsePriceInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function toInputValue(price: number | null): string {
  if (price === null) return "";
  return price.toFixed(2).replace(".", ",");
}

export function PriceManager({ products }: { products: Product[] }) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(products.map((p) => [p.id, toInputValue(p.price)])),
  );
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changed = useMemo(
    () =>
      products.filter((p) => parsePriceInput(values[p.id] ?? "") !== p.price),
    [products, values],
  );

  function setValue(id: string, raw: string) {
    setValues((prev) => ({ ...prev, [id]: raw }));
    setSaved(false);
  }

  function handleSave() {
    const updates = changed.map((p) => ({ id: p.id, price: parsePriceInput(values[p.id] ?? "") }));

    setError(null);
    startTransition(async () => {
      const result = await bulkUpdatePrice(updates);
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
      }
    });
  }

  return (
    <div>
      {/* Tabela: só a partir de sm. No celular a lista de cards abaixo assume. */}
      <div className="hidden overflow-x-auto rounded-2xl border border-brand-sand/70 bg-white sm:block">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-brand-sand/70 bg-brand-cream-dark/40 text-xs uppercase tracking-wide text-brand-ink/50">
            <tr>
              <th className="px-4 py-3 font-medium">Raça</th>
              <th className="px-4 py-3 font-medium">Preço atual</th>
              <th className="px-4 py-3 font-medium">Novo preço (R$)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-sand/60">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3 font-medium text-brand-ink">{product.name}</td>
                <td className="px-4 py-3 text-brand-ink/60">{formatBRL(product.price)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-brand-ink/50">R$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={values[product.id]}
                      onChange={(e) => setValue(product.id, e.target.value)}
                      className="w-28 rounded-lg border border-brand-sand px-3 py-1.5 text-sm outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards: só no celular. */}
      <div className="flex flex-col gap-3 sm:hidden">
        {products.map((product) => (
          <div key={product.id} className="rounded-2xl border border-brand-sand/70 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-brand-ink">{product.name}</span>
              <span className="shrink-0 text-xs text-brand-ink/50">
                Atual: {formatBRL(product.price)}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="text-brand-ink/50">R$</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={values[product.id]}
                onChange={(e) => setValue(product.id, e.target.value)}
                className="w-full rounded-lg border border-brand-sand px-3 py-2 text-sm outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || changed.length === 0}
          className="rounded-full bg-brand-green px-6 py-2.5 text-sm font-medium text-brand-cream hover:bg-brand-green-dark disabled:opacity-50"
        >
          {isPending ? "Salvando..." : `Salvar preços${changed.length > 0 ? ` (${changed.length})` : ""}`}
        </button>
        {saved && !isPending && (
          <span className="flex items-center gap-1.5 text-sm text-brand-green">
            <Check className="h-4 w-4" aria-hidden="true" /> Preços atualizados
          </span>
        )}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  );
}
