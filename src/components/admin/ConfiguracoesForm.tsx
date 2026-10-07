"use client";

import { useActionState } from "react";
import type { FrescorConfig } from "@/lib/data/admin";
import {
  updateFrescorConfig,
  type ConfiguracoesState,
} from "@/app/(admin)/admin/(protected)/configuracoes/actions";

const initialState: ConfiguracoesState = { error: null, success: false };

const inputClass =
  "mt-1.5 w-full rounded-lg border border-brand-sand bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green";

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

/** Regra de frescor de ovos, editável pelo admin — cada criador envia de um
 * lugar diferente e usa um prazo diferente, então os dois números e o
 * estado "local" não ficam mais fixos em 5/7/SP (ver
 * 0011_frescor_configuravel.sql). Mesma lógica de antes, só que configurável:
 *   - até "dias nacional": pode enviar pra qualquer estado do Brasil
 *   - até "dias local": só dá pra garantir dentro do estado configurado
 *   - depois disso, o lote sai da conta de frescor (continua existindo
 *     normalmente no estoque/painel, só não conta mais aqui)
 */
export function ConfiguracoesForm({ frescorConfig }: { frescorConfig: FrescorConfig }) {
  const [state, formAction, pending] = useActionState(updateFrescorConfig, initialState);

  return (
    <form
      action={formAction}
      className="max-w-lg space-y-4 rounded-2xl border border-brand-sand/70 bg-white p-5"
    >
      <div>
        <h2 className="font-serif text-base font-semibold text-brand-ink">Frescor de ovos pra envio</h2>
        <p className="mt-1 text-sm text-brand-ink/60">
          Define quando o site avisa (no carrinho) que um ovo só está garantido pro seu estado, e
          quando o Dashboard avisa que o prazo está terminando. Nunca bloqueia o pedido — é só um
          aviso a mais, o atendimento sempre confirma a disponibilidade de verdade.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="dias_frescor_nacional" className="block text-sm font-medium text-brand-ink">
            Até quantos dias: qualquer estado
          </label>
          <input
            id="dias_frescor_nacional"
            name="dias_frescor_nacional"
            type="number"
            min={0}
            required
            defaultValue={frescorConfig.diasNacional}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="dias_frescor_local" className="block text-sm font-medium text-brand-ink">
            Até quantos dias: só o meu estado
          </label>
          <input
            id="dias_frescor_local"
            name="dias_frescor_local"
            type="number"
            min={0}
            required
            defaultValue={frescorConfig.diasLocal}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="uf_local" className="block text-sm font-medium text-brand-ink">
          Meu estado (UF)
        </label>
        <select
          id="uf_local"
          name="uf_local"
          defaultValue={frescorConfig.ufLocal}
          className={inputClass}
        >
          {UFS.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-brand-ink/50">
          O estado pra onde o 2º prazo (acima) ainda garante o envio — hoje: {frescorConfig.ufLocal}.
        </p>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state.success && !state.error && (
        <p className="text-sm text-brand-green">Configuração salva.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-brand-green px-5 py-2.5 text-sm font-medium text-brand-cream transition-colors hover:bg-brand-green-dark disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
