"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { Ave, AveStatus, Baia } from "@/lib/types/domain";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/utils";
import {
  createAve,
  deleteAve,
  updateAve,
  type FormState,
} from "@/app/(admin)/admin/(protected)/aves/actions";

const initialState: FormState = { error: null };

const inputClass =
  "mt-1.5 w-full rounded-lg border border-brand-sand bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green";

const statusTone: Record<AveStatus, "available" | "gold" | "low" | "neutral" | "out"> = {
  Filhote: "gold",
  "Disponível": "available",
  Reprodutor: "gold",
  "Macho reprodutor": "gold",
  "Fêmea reprodutora": "gold",
  Matriz: "gold",
  Reservado: "low",
  Vendido: "neutral",
  Separado: "low",
  "Óbito": "out",
};

type FilterKey = "todas" | "disponiveis" | "reprodutoras" | "filhotes";

const FILTERS: { key: FilterKey; label: string; match: (status: AveStatus) => boolean }[] = [
  { key: "todas", label: "Todas", match: () => true },
  { key: "disponiveis", label: "Disponíveis", match: (s) => s === "Disponível" },
  {
    key: "reprodutoras",
    label: "Reprodutoras",
    match: (s) => ["Reprodutor", "Macho reprodutor", "Fêmea reprodutora", "Matriz"].includes(s),
  },
  { key: "filhotes", label: "Filhotes", match: (s) => s === "Filhote" },
];

export function AvesManager({ aves, baias }: { aves: Ave[]; baias: Baia[] }) {
  const [filter, setFilter] = useState<FilterKey>("todas");
  const [search, setSearch] = useState("");
  const [novaOpen, setNovaOpen] = useState(false);
  const [editing, setEditing] = useState<Ave | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const activeFilter = FILTERS.find((f) => f.key === filter)!;
    const term = search.trim().toLowerCase();
    return aves.filter((ave) => {
      if (!activeFilter.match(ave.status)) return false;
      if (!term) return true;
      return (
        ave.nome.toLowerCase().includes(term) ||
        ave.codigo.toLowerCase().includes(term) ||
        (ave.baiaNome ?? "").toLowerCase().includes(term)
      );
    });
  }, [aves, filter, search]);

  function handleDelete(ave: Ave) {
    if (!window.confirm(`Excluir a ave "${ave.nome}"? Esta ação não pode ser desfeita.`)) return;
    startTransition(() => deleteAve(ave.id));
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/40"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, código ou baia..."
            className="w-full rounded-full border border-brand-sand bg-white py-2.5 pl-10 pr-4 text-sm text-brand-ink outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
          />
        </div>
        <Button onClick={() => setNovaOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nova ave
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              filter === f.key
                ? "border-brand-green bg-brand-green text-brand-cream"
                : "border-brand-sand bg-white text-brand-ink/70 hover:border-brand-green/50",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-brand-sand bg-white p-10 text-center text-sm text-brand-ink/60">
          Nenhuma ave encontrada.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ave) => (
            <div key={ave.id} className="rounded-2xl border border-brand-sand/70 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-cream-dark/50 text-lg">
                    {ave.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-brand-ink">{ave.nome}</p>
                    <p className="truncate text-xs text-brand-ink/50">
                      {ave.codigo}
                      {ave.baiaNome ? ` · ${ave.baiaNome}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setEditing(ave)}
                    aria-label={`Editar ${ave.nome}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-brand-green hover:bg-brand-green/10"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDelete(ave)}
                    aria-label={`Excluir ${ave.nome}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-brand-ink/50 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Badge tone={statusTone[ave.status]}>{ave.status}</Badge>
                <Badge tone="neutral">{ave.sexo}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      <AveFormSheet open={novaOpen} onClose={() => setNovaOpen(false)} title="Nova ave" baias={baias} action={createAve} />

      {editing && (
        <AveFormSheet
          open={!!editing}
          onClose={() => setEditing(null)}
          title={`Editar ${editing.nome}`}
          baias={baias}
          ave={editing}
          action={updateAve.bind(null, editing.id)}
        />
      )}
    </div>
  );
}

function AveFormSheet({
  open,
  onClose,
  title,
  baias,
  ave,
  action,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  baias: Baia[];
  ave?: Ave;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const closedByUs = useRef(false);

  useEffect(() => {
    if (!pending && !state.error && closedByUs.current === false && formRef.current) {
      closedByUs.current = true;
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <button
          type="submit"
          form="ave-form"
          disabled={pending}
          className="w-full rounded-full bg-brand-green px-6 py-2.5 text-sm font-medium text-brand-cream hover:bg-brand-green-dark disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar ave"}
        </button>
      }
    >
      <form ref={formRef} action={formAction} id="ave-form" className="space-y-4">
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-brand-ink">
            Nome / identificação
          </label>
          <input
            id="nome"
            name="nome"
            type="text"
            required
            autoFocus
            placeholder="Ex: Angola macho grande"
            defaultValue={ave?.nome}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="baia_id" className="block text-sm font-medium text-brand-ink">
            Baia
          </label>
          <select id="baia_id" name="baia_id" defaultValue={ave?.baiaId ?? ""} className={inputClass}>
            <option value="">Sem baia</option>
            {baias.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="sexo" className="block text-sm font-medium text-brand-ink">
              Sexo
            </label>
            <select id="sexo" name="sexo" defaultValue={ave?.sexo ?? "Indefinido"} className={inputClass}>
              <option value="Indefinido">Indefinido</option>
              <option value="Macho">Macho</option>
              <option value="Fêmea">Fêmea</option>
              <option value="Casal">Casal</option>
            </select>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-brand-ink">
              Status
            </label>
            <select id="status" name="status" defaultValue={ave?.status ?? "Filhote"} className={inputClass}>
              <option value="Filhote">Filhote</option>
              <option value="Disponível">Disponível</option>
              <option value="Reprodutor">Reprodutor</option>
              <option value="Macho reprodutor">Macho reprodutor</option>
              <option value="Fêmea reprodutora">Fêmea reprodutora</option>
              <option value="Matriz">Matriz</option>
              <option value="Reservado">Reservado</option>
              <option value="Vendido">Vendido</option>
              <option value="Separado">Separado (observação)</option>
              <option value="Óbito">Óbito</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="data_nascimento" className="block text-sm font-medium text-brand-ink">
            Data de nascimento (opcional)
          </label>
          <input
            id="data_nascimento"
            name="data_nascimento"
            type="date"
            defaultValue={ave?.dataNascimento ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="observacoes" className="block text-sm font-medium text-brand-ink">
            Observações (opcional)
          </label>
          <textarea
            id="observacoes"
            name="observacoes"
            rows={3}
            defaultValue={ave?.observacoes ?? ""}
            className={inputClass}
          />
        </div>

        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
      </form>
    </Sheet>
  );
}
