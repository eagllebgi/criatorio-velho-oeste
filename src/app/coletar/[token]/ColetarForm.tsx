"use client";

import { useActionState, useState } from "react";
import { Egg, Check, Loader2, Plus } from "lucide-react";
import { emojiForEspecie, type Destino } from "@/lib/types/domain";
import { cn } from "@/lib/utils";
import { registrarColeta, type ColetaState } from "./actions";

const DESTINO_LABELS: Record<Destino, string> = {
  venda: "Venda",
  choc: "Chocadeira",
  reservado: "Reservado",
  descarte: "Descarte",
};

const initialState: ColetaState = { error: null, success: null };

/**
 * Tela de coleta que abre ao escanear o QR Code de uma baia
 * (/coletar/[token]) — pensada pra usar no celular/tablet, no meio do
 * galinheiro. Só abre pra quem já está logado (mesma conta do painel admin
 * — ver page.tsx). Nome e espécie vêm prontos do servidor (já é a baia
 * certa, só de confirmar visualmente); dá pra lançar quantidades diferentes
 * pra destinos diferentes numa coleta só (ex: "10 pra chocadeira, 20 pra
 * venda"), igual ao formulário de postura do painel.
 */
export function ColetarForm({
  token,
  nome,
  especie,
  destinoPadrao,
}: {
  token: string;
  nome: string;
  especie: string;
  destinoPadrao: Destino;
}) {
  // Trocar essa key força o formulário (e o useActionState dele) a remontar
  // do zero depois de uma coleta registrada — assim "Registrar outra
  // coleta" sempre começa limpo, sem carregar estado da coleta anterior.
  const [formKey, setFormKey] = useState(0);

  return (
    <div className="flex flex-1 flex-col px-5 py-8 sm:items-center sm:justify-center">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="text-4xl" aria-hidden="true">
            {emojiForEspecie(especie)}
          </span>
          <h1 className="mt-2 font-serif text-2xl font-semibold text-brand-ink">{nome}</h1>
          <p className="text-sm text-brand-ink/50">{especie}</p>
        </div>

        <ColetaFormInner
          key={formKey}
          token={token}
          destinoPadrao={destinoPadrao}
          onRegistrarOutra={() => setFormKey((k) => k + 1)}
        />
      </div>
    </div>
  );
}

interface ColetaItemDraft {
  destino: Destino;
  quantidade: string;
}

function ColetaFormInner({
  token,
  destinoPadrao,
  onRegistrarOutra,
}: {
  token: string;
  destinoPadrao: Destino;
  onRegistrarOutra: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    registrarColeta.bind(null, token),
    initialState,
  );
  const [itens, setItens] = useState<ColetaItemDraft[]>([
    { destino: destinoPadrao, quantidade: "" },
  ]);

  const itensJson = JSON.stringify(
    itens.map((item) => ({ destino: item.destino, quantidade: Number(item.quantidade) || 0 })),
  );

  function updateItem(index: number, patch: Partial<ColetaItemDraft>) {
    setItens((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItens((prev) => [...prev, { destino: "venda", quantidade: "" }]);
  }

  function removeItem(index: number) {
    setItens((prev) => prev.filter((_, i) => i !== index));
  }

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-brand-green/30 bg-white p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
          <Check className="h-7 w-7" aria-hidden="true" />
        </div>
        <p className="font-medium text-brand-ink">Coleta registrada!</p>
        <p className="text-sm text-brand-ink/60">
          Lote{state.success.codigos.length > 1 ? "s" : ""} {state.success.codigos.join(", ")} —{" "}
          {state.success.baiaNome}
        </p>
        <button
          type="button"
          onClick={onRegistrarOutra}
          className="mt-2 rounded-full bg-brand-green px-6 py-2.5 text-sm font-medium text-brand-cream hover:bg-brand-green-dark"
        >
          Registrar outra coleta
        </button>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-brand-sand bg-white p-5"
    >
      <input type="hidden" name="itens" value={itensJson} />

      <div className="space-y-3">
        {itens.map((item, index) => (
          <div key={index} className="rounded-xl border border-brand-sand p-3">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor={`quantidade-${index}`}
                className="text-sm font-medium text-brand-ink"
              >
                {itens.length > 1 ? `Quantidade #${index + 1}` : "Quantos ovos?"}
              </label>
              {itens.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  aria-label="Remover este destino"
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Remover
                </button>
              )}
            </div>
            <input
              id={`quantidade-${index}`}
              type="number"
              inputMode="numeric"
              min={1}
              required
              autoFocus={index === 0}
              value={item.quantidade}
              onChange={(e) => updateItem(index, { quantidade: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-brand-sand bg-white px-4 py-3.5 text-center text-3xl font-semibold text-brand-ink outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(Object.keys(DESTINO_LABELS) as Destino[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => updateItem(index, { destino: d })}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-sm font-medium transition-colors",
                    item.destino === d
                      ? "border-brand-green bg-brand-green text-brand-cream"
                      : "border-brand-sand text-brand-ink/70 hover:border-brand-green/50",
                  )}
                >
                  {DESTINO_LABELS[d]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-1.5 text-sm font-medium text-brand-green hover:underline"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        Adicionar destino
      </button>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-green px-6 py-3.5 text-base font-medium text-brand-cream hover:bg-brand-green-dark disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Egg className="h-4 w-4" aria-hidden="true" />
        )}
        {pending ? "Registrando..." : "Registrar coleta"}
      </button>
    </form>
  );
}
