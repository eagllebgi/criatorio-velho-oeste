"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ArrowDownCircle, ArrowUpCircle, Trash2, Wallet } from "lucide-react";
import type { Financeiro, Product } from "@/lib/types/domain";
import { cn, formatBRL } from "@/lib/utils";
import {
  createTransacao,
  deleteTransacao,
  type FinanceiroFormState,
} from "@/app/(admin)/admin/(protected)/financeiro/actions";
import { VendaRapidaForm } from "@/components/admin/VendaRapidaForm";

const initialState: FinanceiroFormState = { error: null };

function formatDataCurta(data: string): string {
  const [year, month, day] = data.split("-");
  return `${day}/${month}/${year.slice(2)}`;
}

export function FinanceiroManager({
  entries,
  products,
}: {
  entries: Financeiro[];
  products: Product[];
}) {
  const [tipo, setTipo] = useState<"entrada" | "saida">("entrada");
  const [modoEntrada, setModoEntrada] = useState<"produto" | "outro">("produto");
  const [state, formAction, pending] = useActionState(createTransacao, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  useEffect(() => {
    if (!pending && !state.error) {
      formRef.current?.reset();
      // Reseta o seletor de tipo só quando uma submissão acaba de terminar
      // sem erro, não a cada digitação — é o próprio fim do envio que "avisa"
      // o efeito.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTipo("entrada");
    }
    // Só queremos reagir quando uma submissão termina sem erro — não a cada
    // digitação do usuário.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  const mostrarVendaProduto = tipo === "entrada" && modoEntrada === "produto";

  const totals = useMemo(() => {
    const entradas = entries.filter((e) => e.tipo === "entrada").reduce((sum, e) => sum + e.valor, 0);
    const saidas = entries.filter((e) => e.tipo === "saida").reduce((sum, e) => sum + e.valor, 0);
    return { entradas, saidas, saldo: entradas - saidas };
  }, [entries]);

  function handleDelete(id: string, descricao: string) {
    if (!window.confirm(`Excluir o lançamento "${descricao}"?`)) return;
    startDeleteTransition(() => deleteTransacao(id));
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-brand-sand/70 bg-white p-5">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <ArrowUpCircle className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-2xl font-semibold text-brand-ink">{formatBRL(totals.entradas)}</p>
          <p className="text-sm text-brand-ink/60">Entradas do mês</p>
        </div>
        <div className="rounded-2xl border border-brand-sand/70 bg-white p-5">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-700">
            <ArrowDownCircle className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-2xl font-semibold text-brand-ink">{formatBRL(totals.saidas)}</p>
          <p className="text-sm text-brand-ink/60">Saídas do mês</p>
        </div>
        <div className="rounded-2xl border border-brand-sand/70 bg-white p-5">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
            <Wallet className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-2xl font-semibold text-brand-ink">{formatBRL(totals.saldo)}</p>
          <p className="text-sm text-brand-ink/60">Caixa do mês</p>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-sand/70 bg-white p-5">
        <h2 className="font-serif text-base font-semibold text-brand-ink">Novo lançamento</h2>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setTipo("entrada")}
            className={cn(
              "flex-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              tipo === "entrada"
                ? "border-brand-green bg-brand-green text-brand-cream"
                : "border-brand-sand bg-white text-brand-ink/70",
            )}
          >
            Entrada
          </button>
          <button
            type="button"
            onClick={() => setTipo("saida")}
            className={cn(
              "flex-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              tipo === "saida"
                ? "border-red-600 bg-red-600 text-white"
                : "border-brand-sand bg-white text-brand-ink/70",
            )}
          >
            Saída
          </button>
        </div>

        {/* Só faz sentido "vender um produto" numa entrada — uma saída é
            sempre um gasto avulso (ração, remédio etc), por isso esse
            segundo nível de escolha só aparece com Entrada selecionada. */}
        {tipo === "entrada" && (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setModoEntrada("produto")}
              className={cn(
                "flex-1 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                modoEntrada === "produto"
                  ? "border-brand-green bg-brand-green/10 text-brand-green"
                  : "border-brand-sand bg-white text-brand-ink/60",
              )}
            >
              Venda de produto
            </button>
            <button
              type="button"
              onClick={() => setModoEntrada("outro")}
              className={cn(
                "flex-1 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                modoEntrada === "outro"
                  ? "border-brand-green bg-brand-green/10 text-brand-green"
                  : "border-brand-sand bg-white text-brand-ink/60",
              )}
            >
              Outra entrada
            </button>
          </div>
        )}

        {mostrarVendaProduto ? (
          <VendaRapidaForm products={products} />
        ) : (
          <form ref={formRef} action={formAction} className="mt-4">
            <input type="hidden" name="tipo" value={tipo} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="valor" className="block text-sm font-medium text-brand-ink">
                  Valor (R$)
                </label>
                <input
                  id="valor"
                  name="valor"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  required
                  className="mt-1.5 w-full rounded-lg border border-brand-sand bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
                />
              </div>
              <div>
                <label htmlFor="categoria" className="block text-sm font-medium text-brand-ink">
                  Categoria (opcional)
                </label>
                <input
                  id="categoria"
                  name="categoria"
                  type="text"
                  placeholder="Ex: Ração, Venda rápida"
                  className="mt-1.5 w-full rounded-lg border border-brand-sand bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="descricao" className="block text-sm font-medium text-brand-ink">
                  Descrição
                </label>
                <input
                  id="descricao"
                  name="descricao"
                  type="text"
                  required
                  placeholder="Ex: Venda de ovos, Compra de ração"
                  className="mt-1.5 w-full rounded-lg border border-brand-sand bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
                />
              </div>
            </div>

            {state.error && (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="mt-4 w-full rounded-full bg-brand-green px-6 py-2.5 text-sm font-medium text-brand-cream hover:bg-brand-green-dark disabled:opacity-60 sm:w-auto"
            >
              {pending ? "Salvando..." : "Adicionar lançamento"}
            </button>
          </form>
        )}
      </div>

      <div>
        <h2 className="font-serif text-base font-semibold text-brand-ink">Lançamentos do mês</h2>
        {entries.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-brand-sand bg-white p-8 text-center text-sm text-brand-ink/60">
            Nenhum lançamento neste mês ainda.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 rounded-2xl border border-brand-sand/70 bg-white p-3.5"
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    entry.tipo === "entrada"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700",
                  )}
                >
                  {entry.tipo === "entrada" ? (
                    <ArrowUpCircle className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <ArrowDownCircle className="h-4 w-4" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-brand-ink">{entry.descricao}</p>
                  <p className="truncate text-xs text-brand-ink/50">
                    {formatDataCurta(entry.data)}
                    {entry.categoria ? ` · ${entry.categoria}` : ""}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-sm font-semibold",
                    entry.tipo === "entrada" ? "text-emerald-700" : "text-red-700",
                  )}
                >
                  {entry.tipo === "entrada" ? "+" : "−"} {formatBRL(entry.valor)}
                </span>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => handleDelete(entry.id, entry.descricao)}
                  aria-label={`Excluir ${entry.descricao}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-brand-ink/50 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
