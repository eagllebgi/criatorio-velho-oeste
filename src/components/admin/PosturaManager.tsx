"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronRight, Egg } from "lucide-react";
import type { LotePostura, LotePosturaStatus } from "@/lib/types/domain";
import { Badge } from "@/components/ui/Badge";
import { Sheet } from "@/components/ui/Sheet";
import { cn, formatBRL } from "@/lib/utils";
import {
  atualizarStatusLote,
  deleteLote,
  enviarChocadeira,
  registrarNascimento,
  venderLoteRapido,
} from "@/app/(admin)/admin/(protected)/postura/actions";

type TabKey = "disponiveis" | "chocadeira" | "historico";

const TABS: { key: TabKey; label: string; match: (s: LotePosturaStatus) => boolean }[] = [
  { key: "disponiveis", label: "Disponíveis", match: (s) => s === "Disponível" || s === "Reservado" },
  { key: "chocadeira", label: "Chocadeira", match: (s) => s === "Incubando" },
  {
    key: "historico",
    label: "Histórico",
    match: (s) => s === "Vendido" || s === "Concluído" || s === "Descartado",
  },
];

const statusTone: Record<LotePosturaStatus, "available" | "gold" | "low" | "neutral" | "out"> = {
  "Disponível": "available",
  Incubando: "gold",
  Reservado: "low",
  Vendido: "neutral",
  "Concluído": "neutral",
  Descartado: "out",
};

function formatDataCurta(data: string): string {
  const [year, month, day] = data.split("-");
  return `${day}/${month}/${year.slice(2)}`;
}

function diasRestantes(dataIso: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(`${dataIso}T00:00:00`);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86_400_000);
}

export function PosturaManager({ lotes }: { lotes: LotePostura[] }) {
  const [tab, setTab] = useState<TabKey>("disponiveis");
  const [selected, setSelected] = useState<LotePostura | null>(null);

  const filtered = useMemo(() => {
    const activeTab = TABS.find((t) => t.key === tab)!;
    return lotes.filter((l) => activeTab.match(l.status));
  }, [lotes, tab]);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              tab === t.key
                ? "border-brand-green bg-brand-green text-brand-cream"
                : "border-brand-sand bg-white text-brand-ink/70 hover:border-brand-green/50",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-brand-sand bg-white p-10 text-center text-sm text-brand-ink/60">
          Nenhum lote aqui no momento.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-2.5">
          {filtered.map((lote) => (
            <button
              key={lote.id}
              type="button"
              onClick={() => setSelected(lote)}
              className="flex items-center gap-3 rounded-2xl border border-brand-sand/70 bg-white p-4 text-left hover:border-brand-green/50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-cream-dark/50 text-brand-brown">
                <Egg className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-brand-ink">{lote.baiaNome ?? "Baia"}</p>
                  <Badge tone={statusTone[lote.status]}>{lote.status}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-brand-ink/50">
                  {lote.codigo} · {lote.quantidade} ovos · postura em {formatDataCurta(lote.dataPostura)}
                  {lote.precoUnit !== null ? ` · ${formatBRL(lote.precoUnit)}/ovo` : ""}
                </p>
                {lote.status === "Incubando" && lote.eclosaoPrevista && (
                  <p className="mt-0.5 text-xs text-brand-brown-dark">
                    Eclosão prevista: {formatDataCurta(lote.eclosaoPrevista)}
                    {(() => {
                      const dias = diasRestantes(lote.eclosaoPrevista!);
                      if (dias > 0) return ` (em ${dias} dia${dias === 1 ? "" : "s"})`;
                      if (dias === 0) return " (hoje)";
                      return " (atrasada)";
                    })()}
                  </p>
                )}
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-brand-ink/30" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}

      {selected && <LoteAcoesSheet lote={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

type Action = "choc" | "venda" | "nascimento" | null;

function LoteAcoesSheet({ lote, onClose }: { lote: LotePostura; onClose: () => void }) {
  const [action, setAction] = useState<Action>(null);
  const [quantidade, setQuantidade] = useState(lote.quantidade);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runSimple(fn: () => Promise<{ error: string | null }>) {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  function runConfirm() {
    setError(null);
    startTransition(async () => {
      let result: { error: string | null };
      if (action === "choc") result = await enviarChocadeira(lote.id, quantidade);
      else if (action === "venda") result = await venderLoteRapido(lote.id, quantidade);
      else result = await registrarNascimento(lote.id, quantidade);

      if (result.error) setError(result.error);
      else onClose();
    });
  }

  function handleDelete() {
    if (!window.confirm(`Excluir o lote ${lote.codigo} permanentemente?`)) return;
    setError(null);
    startTransition(async () => {
      await deleteLote(lote.id);
      onClose();
    });
  }

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-brand-sand bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green";

  return (
    <Sheet open onClose={onClose} title={`Lote ${lote.codigo}`}>
      <div className="space-y-1 text-sm text-brand-ink/70">
        <p>
          <span className="font-medium text-brand-ink">{lote.baiaNome ?? "Baia"}</span> ·{" "}
          {lote.quantidade} ovos disponíveis
        </p>
        <p>Postura em {formatDataCurta(lote.dataPostura)}</p>
        {lote.precoUnit !== null && <p>Preço: {formatBRL(lote.precoUnit)} por ovo</p>}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {action === null ? (
        <div className="mt-5 flex flex-col gap-2">
          {(lote.status === "Disponível" || lote.status === "Reservado") && (
            <>
              {lote.status === "Reservado" && (
                <ActionButton
                  label="Disponibilizar"
                  onClick={() => runSimple(() => atualizarStatusLote(lote.id, "Disponível"))}
                  disabled={isPending}
                />
              )}
              <ActionButton
                label="Enviar à chocadeira"
                onClick={() => {
                  setQuantidade(lote.quantidade);
                  setAction("choc");
                }}
                disabled={isPending}
                primary
              />
              <ActionButton
                label="Vender"
                onClick={() => {
                  setQuantidade(lote.quantidade);
                  setAction("venda");
                }}
                disabled={isPending}
              />
              <ActionButton
                label="Descartar lote"
                tone="danger"
                onClick={() => runSimple(() => atualizarStatusLote(lote.id, "Descartado"))}
                disabled={isPending}
              />
            </>
          )}

          {lote.status === "Incubando" && (
            <>
              <ActionButton
                label="Registrar nascimento"
                onClick={() => {
                  setQuantidade(lote.quantidade);
                  setAction("nascimento");
                }}
                disabled={isPending}
                primary
              />
              <ActionButton
                label="Devolver aos disponíveis"
                onClick={() => runSimple(() => atualizarStatusLote(lote.id, "Disponível"))}
                disabled={isPending}
              />
              <ActionButton
                label="Descartar lote"
                tone="danger"
                onClick={() => runSimple(() => atualizarStatusLote(lote.id, "Descartado"))}
                disabled={isPending}
              />
            </>
          )}

          {(lote.status === "Vendido" ||
            lote.status === "Concluído" ||
            lote.status === "Descartado") && (
            <ActionButton label="Excluir lote" tone="danger" onClick={handleDelete} disabled={isPending} />
          )}
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="quantidade-acao" className="block text-sm font-medium text-brand-ink">
              {action === "nascimento" ? "Quantos nasceram?" : "Quantidade"}
            </label>
            <input
              id="quantidade-acao"
              type="number"
              min={0}
              max={action === "nascimento" ? undefined : lote.quantidade}
              autoFocus
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAction(null)}
              className="flex-1 rounded-full border border-brand-sand px-4 py-2.5 text-sm font-medium text-brand-ink/70 hover:border-brand-green"
            >
              Voltar
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={runConfirm}
              className="flex-1 rounded-full bg-brand-green px-4 py-2.5 text-sm font-medium text-brand-cream hover:bg-brand-green-dark disabled:opacity-60"
            >
              {isPending ? "Salvando..." : "Confirmar"}
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  primary,
  tone,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  tone?: "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full rounded-full px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60",
        primary && "bg-brand-green text-brand-cream hover:bg-brand-green-dark",
        !primary && !tone && "border border-brand-sand text-brand-ink/70 hover:border-brand-green hover:text-brand-green",
        tone === "danger" && "border border-red-200 text-red-600 hover:bg-red-50",
      )}
    >
      {label}
    </button>
  );
}
