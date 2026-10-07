"use client";

import { useActionState, useMemo, useState } from "react";
import { Check, Egg, Loader2 } from "lucide-react";
import { emojiForEspecie, type Destino } from "@/lib/types/domain";
import {
  createLancamentoMestre,
  type LancamentoMestreResult,
} from "@/app/(admin)/admin/(protected)/baias/actions";

const DESTINO_LABELS: Record<Destino, string> = {
  venda: "Venda",
  choc: "Chocadeira",
  reservado: "Reservado",
  descarte: "Descarte",
};

export interface LancamentoMestreBaia {
  id: string;
  nome: string;
  especie: string;
  destinoPadrao: Destino;
}

const initialState: LancamentoMestreResult = { error: null };

/** Lançamento mestre: uma linha por baia, só a quantidade — pensado pra
 * fechar a coleta do dia inteiro numa tela só, sem abrir baia por baia. Cada
 * baia vai pro destino padrão dela (mostrado do lado do nome); quando um dia
 * precisar de outro destino numa baia específica, continua dando pra usar o
 * "Postura" normal daquela baia (no card dela, em /admin/baias). Mesmo
 * componente usado tanto em /admin/baias/lancamento (dentro do painel)
 * quanto em /coletar/mestre (a partir do QR Code mestre) — mesma ação do
 * servidor (createLancamentoMestre) nos dois lugares, pra nunca ficarem
 * dessincronizados. */
export function LancamentoMestreForm({ baias }: { baias: LancamentoMestreBaia[] }) {
  const [formKey, setFormKey] = useState(0);

  if (baias.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-brand-sand bg-white p-6 text-center text-sm text-brand-ink/60">
        Nenhuma baia ativa cadastrada ainda.
      </p>
    );
  }

  return (
    <LancamentoMestreFormInner
      key={formKey}
      baias={baias}
      onRegistrarOutro={() => setFormKey((k) => k + 1)}
    />
  );
}

function LancamentoMestreFormInner({
  baias,
  onRegistrarOutro,
}: {
  baias: LancamentoMestreBaia[];
  onRegistrarOutro: () => void;
}) {
  const [state, formAction, pending] = useActionState(createLancamentoMestre, initialState);
  const [quantidades, setQuantidades] = useState<Record<string, string>>({});
  const today = new Date().toISOString().split("T")[0];

  const { itensJson, totalBaias, totalOvos } = useMemo(() => {
    const itens = baias
      .map((b) => ({ baiaId: b.id, quantidade: Number(quantidades[b.id]) || 0 }))
      .filter((i) => i.quantidade > 0);
    return {
      itensJson: JSON.stringify(itens),
      totalBaias: itens.length,
      totalOvos: itens.reduce((sum, i) => sum + i.quantidade, 0),
    };
  }, [baias, quantidades]);

  // Sucesso só depois de uma submissão de verdade (o estado inicial também
  // tem error === null, mas totalOvos vem undefined até a ação rodar).
  if (state.error === null && state.totalOvos !== undefined) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-brand-green/30 bg-white p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
          <Check className="h-7 w-7" aria-hidden="true" />
        </div>
        <p className="font-medium text-brand-ink">Lançamento registrado!</p>
        <p className="text-sm text-brand-ink/60">
          {state.totalOvos} ovo{state.totalOvos === 1 ? "" : "s"} em {state.totalBaias} baia
          {state.totalBaias === 1 ? "" : "s"}.
        </p>
        <button
          type="button"
          onClick={onRegistrarOutro}
          className="mt-2 rounded-full bg-brand-green px-6 py-2.5 text-sm font-medium text-brand-cream hover:bg-brand-green-dark"
        >
          Novo lançamento
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="itens" value={itensJson} />

      <div>
        <label htmlFor="lm-data" className="block text-sm font-medium text-brand-ink">
          Data da coleta
        </label>
        <input
          id="lm-data"
          name="data_postura"
          type="date"
          defaultValue={today}
          className="mt-1.5 w-full max-w-[12rem] rounded-lg border border-brand-sand bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
        />
      </div>

      <div className="divide-y divide-brand-sand/60 overflow-hidden rounded-2xl border border-brand-sand bg-white">
        {baias.map((baia) => (
          <div key={baia.id} className="flex items-center gap-3 px-4 py-3">
            <span className="text-xl" aria-hidden="true">
              {emojiForEspecie(baia.especie)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-brand-ink">{baia.nome}</p>
              <p className="truncate text-xs text-brand-ink/50">
                {baia.especie} · {DESTINO_LABELS[baia.destinoPadrao]}
              </p>
            </div>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="0"
              value={quantidades[baia.id] ?? ""}
              onChange={(e) => setQuantidades((prev) => ({ ...prev, [baia.id]: e.target.value }))}
              className="w-20 shrink-0 rounded-lg border border-brand-sand bg-white px-3 py-2 text-center text-base font-semibold text-brand-ink outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
            />
          </div>
        ))}
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || totalBaias === 0}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-green px-6 py-3.5 text-base font-medium text-brand-cream hover:bg-brand-green-dark disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Egg className="h-4 w-4" aria-hidden="true" />
        )}
        {pending
          ? "Registrando..."
          : totalBaias === 0
            ? "Informe ao menos uma quantidade"
            : `Registrar — ${totalOvos} ovo${totalOvos === 1 ? "" : "s"} em ${totalBaias} baia${totalBaias === 1 ? "" : "s"}`}
      </button>
    </form>
  );
}
