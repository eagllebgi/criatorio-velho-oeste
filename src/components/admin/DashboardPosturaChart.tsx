"use client";

import { useMemo, useState } from "react";
import { PosturaBarChart } from "@/components/admin/PosturaBarChart";
import { buildDailySeries } from "@/lib/postura";
import type { LotePostura } from "@/lib/types/domain";
import { cn } from "@/lib/utils";

interface BaiaOption {
  id: string;
  nome: string;
}

/** Mesmo gráfico de barras usado dentro de cada baia (ver BaiasManager), só
 * que aqui no Dashboard dá pra ver geral (todas as baias somadas) ou trocar
 * pra uma baia específica num seletor — sem precisar entrar em Baias e abrir
 * uma por uma só pra comparar o ritmo de produção. */
export function DashboardPosturaChart({
  lotes,
  baias,
}: {
  lotes: LotePostura[];
  baias: BaiaOption[];
}) {
  const [baiaId, setBaiaId] = useState<string>("all");
  const [periodo, setPeriodo] = useState<30 | 90>(30);

  const lotesFiltrados = useMemo(
    () => (baiaId === "all" ? lotes : lotes.filter((l) => l.baiaId === baiaId)),
    [lotes, baiaId],
  );
  const serie = useMemo(() => buildDailySeries(lotesFiltrados, periodo), [lotesFiltrados, periodo]);
  const total = serie.reduce((sum, d) => sum + d.quantidade, 0);

  if (baias.length === 0) return null;

  return (
    <div className="mt-8 rounded-2xl border border-brand-sand/70 bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-lg font-semibold text-brand-ink">
            Postura — ritmo de produção
          </h2>
          <p className="mt-1 text-sm text-brand-ink/60">
            {total === 0
              ? `Nenhuma postura registrada nos últimos ${periodo} dias.`
              : `${total} ovo${total === 1 ? "" : "s"} nos últimos ${periodo} dias${
                  baiaId === "all" ? ", todas as baias" : ""
                }.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={baiaId}
            onChange={(e) => setBaiaId(e.target.value)}
            className="rounded-full border border-brand-sand bg-white px-3 py-1.5 text-xs font-medium text-brand-ink outline-none focus:border-brand-green"
          >
            <option value="all">Geral (todas as baias)</option>
            {baias.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome}
              </option>
            ))}
          </select>
          <div className="flex shrink-0 gap-1">
            {([30, 90] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriodo(p)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium",
                  periodo === p
                    ? "border-brand-green bg-brand-green text-brand-cream"
                    : "border-brand-sand text-brand-ink/60 hover:border-brand-green/50",
                )}
              >
                {p}d
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <PosturaBarChart data={serie} />
      </div>

      <p className="mt-3 text-xs text-brand-ink/40">
        Soma todos os destinos (venda, chocadeira, reservado e descarte). Passe o mouse (ou toque)
        numa barra pra ver a data e a quantidade exata.
      </p>
    </div>
  );
}
