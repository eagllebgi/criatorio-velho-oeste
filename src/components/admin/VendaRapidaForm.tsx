"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/lib/types/domain";
import { FORMA_PAGAMENTO_LABELS } from "@/lib/types/domain";
import { formatBRL, toPriceInputValue } from "@/lib/utils";
import {
  createVendaRapida,
  type FinanceiroFormState,
} from "@/app/(admin)/admin/(protected)/financeiro/actions";

const initialState: FinanceiroFormState = { error: null };

/** Lança uma venda direto a partir de um produto do catálogo (ovo ou ave):
 * escolhe o produto, a quantidade e confere o preço — a descrição do
 * lançamento e o desconto do estoque acontecem sozinhos. Só lista produtos
 * ativos com estoque, já que não dá pra vender o que não existe. */
export function VendaRapidaForm({ products }: { products: Product[] }) {
  const disponiveis = useMemo(
    () =>
      products
        .filter((p) => p.active && p.stock > 0)
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [products],
  );

  const [state, formAction, pending] = useActionState(createVendaRapida, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedId, setSelectedId] = useState(disponiveis[0]?.id ?? "");
  const [quantidade, setQuantidade] = useState("1");
  const [precoUnit, setPrecoUnit] = useState(() => toPriceInputValue(disponiveis[0]?.price ?? null));

  const selected = disponiveis.find((p) => p.id === selectedId) ?? null;

  useEffect(() => {
    if (!pending && !state.error) {
      formRef.current?.reset();
      // Reseta pro primeiro produto disponível só quando a venda acaba de
      // ser registrada com sucesso — não a cada digitação.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuantidade("1");
      setSelectedId(disponiveis[0]?.id ?? "");
      setPrecoUnit(toPriceInputValue(disponiveis[0]?.price ?? null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  function handleSelectProduct(id: string) {
    setSelectedId(id);
    const product = disponiveis.find((p) => p.id === id);
    setPrecoUnit(toPriceInputValue(product?.price ?? null));
  }

  const quantidadeNum = Number(quantidade.replace(",", "."));
  const precoUnitNum = Number(precoUnit.trim().replace(/\./g, "").replace(",", "."));
  const total =
    Number.isFinite(quantidadeNum) && Number.isFinite(precoUnitNum) ? quantidadeNum * precoUnitNum : 0;

  if (disponiveis.length === 0) {
    return (
      <p className="mt-4 rounded-lg border border-dashed border-brand-sand bg-brand-cream-dark/30 p-4 text-sm text-brand-ink/60">
        Nenhum produto ativo com estoque disponível agora. Reponha o estoque em Produtos pra vender por aqui.
      </p>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="mt-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="venda-produto" className="block text-sm font-medium text-brand-ink">
            Produto
          </label>
          <select
            id="venda-produto"
            name="productId"
            value={selectedId}
            onChange={(e) => handleSelectProduct(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-brand-sand bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
          >
            {disponiveis.some((p) => p.productType === "ovo") && (
              <optgroup label="Ovos">
                {disponiveis
                  .filter((p) => p.productType === "ovo")
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.stock} em estoque
                    </option>
                  ))}
              </optgroup>
            )}
            {disponiveis.some((p) => p.productType === "ave") && (
              <optgroup label="Aves">
                {disponiveis
                  .filter((p) => p.productType === "ave")
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.stock} em estoque
                    </option>
                  ))}
              </optgroup>
            )}
          </select>
        </div>

        <div>
          <label htmlFor="quantidade" className="block text-sm font-medium text-brand-ink">
            Quantidade
          </label>
          <input
            id="quantidade"
            name="quantidade"
            type="number"
            min={1}
            max={selected?.stock}
            step={1}
            required
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-brand-sand bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
          />
        </div>

        <div>
          <label htmlFor="precoUnit" className="block text-sm font-medium text-brand-ink">
            Preço unitário (R$)
          </label>
          <input
            id="precoUnit"
            name="precoUnit"
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            required
            value={precoUnit}
            onChange={(e) => setPrecoUnit(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-brand-sand bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
          />
        </div>

        <div>
          <label htmlFor="venda-forma-pagamento" className="block text-sm font-medium text-brand-ink">
            Forma de pagamento
          </label>
          <select
            id="venda-forma-pagamento"
            name="forma_pagamento"
            defaultValue="pix"
            className="mt-1.5 w-full rounded-lg border border-brand-sand bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
          >
            {Object.entries(FORMA_PAGAMENTO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-3 text-sm text-brand-ink/60">
        Total: <span className="font-semibold text-brand-ink">{formatBRL(total)}</span>
      </p>

      {state.error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !selected}
        className="mt-4 w-full rounded-full bg-brand-green px-6 py-2.5 text-sm font-medium text-brand-cream hover:bg-brand-green-dark disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Salvando..." : "Registrar venda"}
      </button>
    </form>
  );
}
