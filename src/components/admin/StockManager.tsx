"use client";

import { useMemo, useState, useTransition } from "react";
import { Check } from "lucide-react";
import type { Product } from "@/lib/types/domain";
import { bulkUpdateStock } from "@/app/(admin)/admin/(protected)/estoque/actions";

const QUICK_DELTAS = [-6, -1, 1, 6];

export function StockManager({ products }: { products: Product[] }) {
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(products.map((p) => [p.id, p.stock])),
  );
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changedCount = useMemo(
    () => products.filter((p) => values[p.id] !== p.stock).length,
    [products, values],
  );

  function setValue(id: string, next: number) {
    setValues((prev) => ({ ...prev, [id]: Math.max(0, next) }));
    setSaved(false);
  }

  function handleSave() {
    const updates = products
      .filter((p) => values[p.id] !== p.stock)
      .map((p) => ({ id: p.id, stock: values[p.id] }));

    setError(null);
    startTransition(async () => {
      const result = await bulkUpdateStock(updates);
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
      }
    });
  }

  return (
    <div>
      {/* Tabela: só a partir de sm, onde as 4 colunas cabem sem rolar de
          lado. No celular a lista de cards abaixo assume. */}
      <div className="hidden overflow-x-auto rounded-2xl border border-brand-sand/70 bg-white sm:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-brand-sand/70 bg-brand-cream-dark/40 text-xs uppercase tracking-wide text-brand-ink/50">
            <tr>
              <th className="px-4 py-3 font-medium">Raça</th>
              <th className="px-4 py-3 font-medium">Estoque atual</th>
              <th className="px-4 py-3 font-medium">Ajuste rápido</th>
              <th className="px-4 py-3 font-medium">Novo estoque</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-sand/60">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3 font-medium text-brand-ink">{product.name}</td>
                <td className="px-4 py-3 text-brand-ink/60">{product.stock}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {QUICK_DELTAS.map((delta) => (
                      <button
                        key={delta}
                        type="button"
                        onClick={() => setValue(product.id, values[product.id] + delta)}
                        className="rounded-full border border-brand-sand px-2.5 py-1 text-xs font-medium text-brand-ink/70 hover:border-brand-green hover:text-brand-green"
                      >
                        {delta > 0 ? `+${delta}` : delta}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min={0}
                    value={values[product.id]}
                    onChange={(e) => setValue(product.id, Number(e.target.value))}
                    className="w-24 rounded-lg border border-brand-sand px-3 py-1.5 text-sm outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
                  />
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
              <span className="shrink-0 text-xs text-brand-ink/50">Atual: {product.stock}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {QUICK_DELTAS.map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => setValue(product.id, values[product.id] + delta)}
                  className="rounded-full border border-brand-sand px-3 py-1.5 text-xs font-medium text-brand-ink/70 hover:border-brand-green hover:text-brand-green"
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={0}
              value={values[product.id]}
              onChange={(e) => setValue(product.id, Number(e.target.value))}
              className="mt-3 w-full rounded-lg border border-brand-sand px-3 py-2 text-sm outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
            />
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || changedCount === 0}
          className="rounded-full bg-brand-green px-6 py-2.5 text-sm font-medium text-brand-cream hover:bg-brand-green-dark disabled:opacity-50"
        >
          {isPending ? "Salvando..." : `Salvar alterações${changedCount > 0 ? ` (${changedCount})` : ""}`}
        </button>
        {saved && !isPending && (
          <span className="flex items-center gap-1.5 text-sm text-brand-green">
            <Check className="h-4 w-4" aria-hidden="true" /> Estoque atualizado
          </span>
        )}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  );
}
