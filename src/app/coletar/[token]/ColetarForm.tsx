"use client";

import { useActionState, useState } from "react";
import { Egg, Check, Loader2 } from "lucide-react";
import { emojiForEspecie, type Destino } from "@/lib/types/domain";
import { cn } from "@/lib/utils";
import { registrarColeta, type ColetaState } from "./actions";

const DESTINO_OPTIONS: { value: Destino; label: string }[] = [
  { value: "venda", label: "Venda" },
  { value: "choc", label: "Chocadeira" },
  { value: "reservado", label: "Reservado" },
  { value: "descarte", label: "Descarte" },
];

const initialState: ColetaState = { error: null, success: null };

/**
 * Tela de coleta que abre ao escanear o QR Code de uma baia
 * (/coletar/[token]) — pensada pra usar no celular/tablet, no meio do
 * galinheiro, sem precisar logar em nada. Nome e espécie vêm prontos do
 * servidor (já é a baia certa, só de confirmar visualmente); o camponês só
 * digita a quantidade e confirma o destino, já vindo pré-selecionado com o
 * padrão cadastrado na baia.
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
  const [destino, setDestino] = useState<Destino>(destinoPadrao);

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-brand-green/30 bg-white p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
          <Check className="h-7 w-7" aria-hidden="true" />
        </div>
        <p className="font-medium text-brand-ink">Coleta registrada!</p>
        <p className="text-sm text-brand-ink/60">
          Lote {state.success.codigo} — {state.success.baiaNome}
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
      className="space-y-5 rounded-2xl border border-brand-sand bg-white p-5"
    >
      <div>
        <label htmlFor="quantidade" className="block text-sm font-medium text-brand-ink">
          Quantos ovos?
        </label>
        <input
          id="quantidade"
          name="quantidade"
          type="number"
          inputMode="numeric"
          min={1}
          required
          autoFocus
          className="mt-1.5 w-full rounded-xl border border-brand-sand bg-white px-4 py-3.5 text-center text-3xl font-semibold text-brand-ink outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
        />
      </div>

      <div>
        <p className="text-sm font-medium text-brand-ink">Destino</p>
        <input type="hidden" name="destino" value={destino} />
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {DESTINO_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDestino(opt.value)}
              className={cn(
                "rounded-xl border px-3 py-3 text-sm font-medium transition-colors",
                destino === opt.value
                  ? "border-brand-green bg-brand-green text-brand-cream"
                  : "border-brand-sand text-brand-ink/70 hover:border-brand-green/50",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

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
