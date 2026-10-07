"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowUpDown,
  BarChart3,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Egg,
  Loader2,
  MessageSquarePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { emojiForEspecie, type Ave, type AveStatus, type Baia, type LotePostura } from "@/lib/types/domain";
import { Badge, badgeToneClasses, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { cn, formatBRL } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { buildBaiaImagePath } from "@/lib/storage";
import { ImageCropModal } from "@/components/admin/ImageCropModal";
import { BaiaQrCode } from "@/components/admin/BaiaQrCode";
import { PosturaBarChart } from "@/components/admin/PosturaBarChart";
import { buildDailySeries } from "@/lib/postura";
import {
  createBaia,
  createObservacao,
  createPostura,
  deleteBaia,
  updateBaia,
  updateBaiaDestinoQuick,
  updateBaiaStatusQuick,
  type FormState,
} from "@/app/(admin)/admin/(protected)/baias/actions";
import { createAvesLote, deleteAve } from "@/app/(admin)/admin/(protected)/aves/actions";

const BUCKET = "product-images";

const initialState: FormState = { error: null };

const inputClass =
  "mt-1.5 w-full rounded-lg border border-brand-sand bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green";

const statusTone: Record<Baia["status"], BadgeTone> = {
  Ativa: "available",
  "Reprodução": "gold",
  Inativa: "neutral",
};

const destinoTone: Record<Baia["destinoPadrao"], BadgeTone> = {
  venda: "available",
  choc: "gold",
  reservado: "low",
  descarte: "out",
};

type SortMode = "numero" | "nome" | "especie" | "aves";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "numero", label: "Número da baia" },
  { value: "nome", label: "Nome (A-Z)" },
  { value: "especie", label: "Espécie (A-Z)" },
  { value: "aves", label: "Mais aves primeiro" },
];

export function BaiasManager({
  baias,
  aves,
  lotes,
  qrDataUrls,
}: {
  baias: Baia[];
  /** Plantel completo — filtrado por baia na hora de abrir "Ver aves". */
  aves: Ave[];
  /** Todos os lotes de postura — filtrados por baia na hora de abrir o
   * gráfico de cada uma. */
  lotes: LotePostura[];
  /** PNG (data URI) do QR Code de coleta de cada baia, já gerado no servidor
   * (page.tsx) — mapeado por baia.id. */
  qrDataUrls: Record<string, string>;
}) {
  const [novaOpen, setNovaOpen] = useState(false);
  const [editing, setEditing] = useState<Baia | null>(null);
  const [posturaFor, setPosturaFor] = useState<Baia | null>(null);
  const [obsFor, setObsFor] = useState<Baia | null>(null);
  const [avesFor, setAvesFor] = useState<Baia | null>(null);
  const [graficoFor, setGraficoFor] = useState<Baia | null>(null);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("numero");
  const [isPending, startTransition] = useTransition();

  const filteredBaias = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return baias;
    return baias.filter(
      (baia) =>
        baia.nome.toLowerCase().includes(term) ||
        baia.codigo.toLowerCase().includes(term) ||
        baia.especie.toLowerCase().includes(term) ||
        (baia.setor ?? "").toLowerCase().includes(term),
    );
  }, [baias, search]);

  // "Número" é a ordem que já vem do servidor (ver getAllBaiasAdmin) — não
  // precisa reordenar de novo. Os outros modos só entram em ação quando
  // escolhidos no seletor, sem mexer na ordem padrão do dia a dia.
  const sortedBaias = useMemo(() => {
    if (sortMode === "numero") return filteredBaias;
    const copy = [...filteredBaias];
    switch (sortMode) {
      case "nome":
        copy.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
        break;
      case "especie":
        copy.sort(
          (a, b) => a.especie.localeCompare(b.especie, "pt-BR") || a.nome.localeCompare(b.nome, "pt-BR"),
        );
        break;
      case "aves":
        copy.sort((a, b) => b.totalAves - a.totalAves || a.nome.localeCompare(b.nome, "pt-BR"));
        break;
    }
    return copy;
  }, [filteredBaias, sortMode]);

  function handleDelete(baia: Baia) {
    if (
      !window.confirm(
        `Excluir a baia "${baia.nome}"? Os lotes de postura dela também serão excluídos. Esta ação não pode ser desfeita.`,
      )
    ) {
      return;
    }
    startTransition(() => deleteBaia(baia.id));
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
            placeholder="Buscar por nome, código, espécie ou setor..."
            className="w-full rounded-full border border-brand-sand bg-white py-2.5 pl-10 pr-4 text-sm text-brand-ink outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
          />
        </div>
        <div className="relative shrink-0">
          <ArrowUpDown
            className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-ink/40"
            aria-hidden="true"
          />
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            aria-label="Ordenar baias por"
            className="w-full appearance-none rounded-full border border-brand-sand bg-white py-2.5 pl-9 pr-8 text-sm text-brand-ink outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green sm:w-auto"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-ink/40"
            aria-hidden="true"
          />
        </div>
        <Button href="/admin/baias/lancamento" variant="outline">
          <ClipboardList className="h-4 w-4" aria-hidden="true" />
          Lançamento diário
        </Button>
        <Button onClick={() => setNovaOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nova baia
        </Button>
      </div>

      {baias.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-brand-sand bg-white p-10 text-center text-sm text-brand-ink/60">
          Nenhuma baia cadastrada ainda.
        </p>
      ) : sortedBaias.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-brand-sand bg-white p-10 text-center text-sm text-brand-ink/60">
          Nenhuma baia encontrada pra essa busca.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedBaias.map((baia) => (
            <div key={baia.id} className="rounded-2xl border border-brand-sand/70 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <BaiaFotoAvatar baia={baia} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-brand-ink">{baia.nome}</p>
                    <p className="text-xs text-brand-ink/50">
                      {baia.codigo} · {baia.especie}
                      {baia.setor ? ` · ${baia.setor}` : ""}
                    </p>
                  </div>
                </div>
                {/* Cantinho superior direito do card: QR Code de coleta e
                    excluir (única ação destrutiva) ficam juntos aqui,
                    pequenos e isolados de propósito. Editar virou um botão
                    completo lá embaixo, mais fácil de acertar o toque. */}
                <div className="flex shrink-0 items-center gap-1">
                  <BaiaQrCode
                    nome={baia.nome}
                    codigo={baia.codigo}
                    especie={baia.especie}
                    dataUrl={qrDataUrls[baia.id]}
                    className="h-8 w-8 border-transparent shadow-none hover:border-brand-green"
                  />
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDelete(baia)}
                    aria-label={`Excluir ${baia.nome}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-brand-ink/50 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <StatusQuickSelect baiaId={baia.id} status={baia.status} />
                <DestinoQuickSelect baiaId={baia.id} destino={baia.destinoPadrao} />
                {baia.precoOvo !== null && <Badge tone="neutral">{formatBRL(baia.precoOvo)}/ovo</Badge>}
              </div>

              {/* Contagem de aves vinculadas a essa baia — direto do banco,
                  sempre batendo com o que está cadastrado em Plantel. Clica
                  pra ver a lista (nome, anilha, status) sem sair da tela. */}
              <button
                type="button"
                onClick={() => setAvesFor(baia)}
                className="mt-2.5 flex w-full items-center gap-1.5 rounded-lg py-0.5 text-left text-xs text-brand-ink/60 hover:text-brand-green"
              >
                <Users className="h-3.5 w-3.5 shrink-0 text-brand-ink/40" aria-hidden="true" />
                <span className="flex-1">
                  {baia.totalAves === 0
                    ? "0 aves"
                    : `${baia.totalAves} ave${baia.totalAves === 1 ? "" : "s"} · ${baia.machos} macho${baia.machos === 1 ? "" : "s"}, ${baia.femeas} fêmea${baia.femeas === 1 ? "" : "s"}`}
                </span>
                <ChevronRight className="h-3 w-3 shrink-0 text-brand-ink/30" aria-hidden="true" />
              </button>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(baia)}
                  className="flex items-center justify-center gap-1.5 rounded-full border border-brand-sand px-2 py-2 text-xs font-medium text-brand-ink/70 hover:border-brand-green hover:text-brand-green"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setPosturaFor(baia)}
                  className="flex items-center justify-center gap-1.5 rounded-full border border-brand-green px-2 py-2 text-xs font-medium text-brand-green hover:bg-brand-green hover:text-brand-cream"
                >
                  <Egg className="h-3.5 w-3.5" aria-hidden="true" />
                  Postura
                </button>
                <button
                  type="button"
                  onClick={() => setObsFor(baia)}
                  className="flex items-center justify-center gap-1.5 rounded-full border border-brand-sand px-2 py-2 text-xs font-medium text-brand-ink/70 hover:border-brand-green hover:text-brand-green"
                >
                  <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden="true" />
                  Obs.
                </button>
                <button
                  type="button"
                  onClick={() => setGraficoFor(baia)}
                  className="flex items-center justify-center gap-1.5 rounded-full border border-brand-sand px-2 py-2 text-xs font-medium text-brand-ink/70 hover:border-brand-green hover:text-brand-green"
                >
                  <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                  Gráfico
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <BaiaFormSheet
        open={novaOpen}
        onClose={() => setNovaOpen(false)}
        title="Nova baia"
        action={createBaia}
      />

      {editing && (
        <BaiaFormSheet
          open={!!editing}
          onClose={() => setEditing(null)}
          title={`Editar ${editing.nome}`}
          baia={editing}
          action={updateBaia.bind(null, editing.id)}
          onViewAves={() => {
            const alvo = editing;
            setEditing(null);
            setAvesFor(alvo);
          }}
        />
      )}

      {posturaFor && (
        <PosturaFormSheet baia={posturaFor} onClose={() => setPosturaFor(null)} />
      )}

      {obsFor && <ObsSheet baia={obsFor} onClose={() => setObsFor(null)} />}

      {avesFor && (
        <BaiaAvesSheet
          baia={avesFor}
          aves={aves.filter((a) => a.baiaId === avesFor.id)}
          onClose={() => setAvesFor(null)}
        />
      )}

      {graficoFor && (
        <BaiaGraficoSheet
          baia={graficoFor}
          lotes={lotes.filter((l) => l.baiaId === graficoFor.id)}
          onClose={() => setGraficoFor(null)}
        />
      )}
    </div>
  );
}

/** Avatar clicável: clica na foto (ou no emoji padrão da espécie, se ainda
 * não tiver foto) pra trocar por uma foto real da baia/espécie. Mesmo
 * padrão de upload direto pelo navegador do PhotoCell de Produtos
 * (AdminProductTable.tsx) e do AveFotoAvatar em AvesManager.tsx. */
function BaiaFotoAvatar({ baia }: { baia: Baia }) {
  const [preview, setPreview] = useState<string | null>(baia.fotoUrl);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setPendingFile(file);
  }

  async function handleCropped(blob: Blob) {
    setPendingFile(null);
    setUploading(true);
    setError(null);
    const supabase = createClient();

    try {
      const path = buildBaiaImagePath(baia.id, "foto.jpg");
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { upsert: false, contentType: "image/jpeg" });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const url = publicUrlData.publicUrl;

      // Atualiza só a foto da baia — a propagação pra todas as aves
      // vinculadas (plantel) acontece sozinha no banco (ver migration
      // 0006_fotos_cascata.sql), sem precisar de nenhuma chamada extra aqui.
      const { error: updateError } = await supabase
        .from("baias")
        .update({ foto_url: url })
        .eq("id", baia.id);
      if (updateError) throw updateError;

      setPreview(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a foto.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <>
      <label
        title="Clique para trocar a foto"
        className="group relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-brand-cream-dark/50 text-lg"
      >
        {preview ? (
          <Image src={preview} alt={baia.nome} fill sizes="40px" className="object-cover" />
        ) : (
          <span>{emojiForEspecie(baia.especie)}</span>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-white" aria-hidden="true" />
          ) : (
            <Pencil
              className="h-3 w-3 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-hidden="true"
            />
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            handleFile(e.target.files);
            e.target.value = "";
          }}
        />
        {error && (
          <span className="absolute left-1/2 top-full z-10 mt-1 w-max max-w-[9rem] -translate-x-1/2 rounded-md bg-red-600 px-2 py-1 text-[0.65rem] text-white">
            {error}
          </span>
        )}
      </label>

      {pendingFile && (
        <ImageCropModal
          file={pendingFile}
          aspect={1}
          title="Ajustar foto da baia"
          onCancel={() => setPendingFile(null)}
          onCropped={handleCropped}
        />
      )}
    </>
  );
}

/** Select disfarçado de badge colorido — clica, escolhe e salva sozinho,
 * sem precisar abrir o painel de edição completo. Mesmo padrão de "clica e
 * salva" já usado no preço/estoque de Produtos. */
function QuickSelectBadge<T extends string>({
  value,
  tone,
  options,
  onCommit,
}: {
  value: T;
  tone: BadgeTone;
  options: { value: T; label: string }[];
  onCommit: (next: T) => void;
}) {
  const [current, setCurrent] = useState(value);
  const [isPending, startTransition] = useTransition();

  function handleChange(next: T) {
    setCurrent(next);
    startTransition(() => onCommit(next));
  }

  return (
    <span className="relative inline-flex items-center">
      <select
        value={current}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value as T)}
        className={cn(
          "appearance-none rounded-full py-1 pl-3 pr-6 text-xs font-medium outline-none cursor-pointer disabled:cursor-wait disabled:opacity-70",
          badgeToneClasses[tone],
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {isPending ? (
        <Loader2
          className="pointer-events-none absolute right-1.5 h-3 w-3 animate-spin opacity-70"
          aria-hidden="true"
        />
      ) : (
        <ChevronDown
          className="pointer-events-none absolute right-1.5 h-3 w-3 opacity-60"
          aria-hidden="true"
        />
      )}
    </span>
  );
}

function StatusQuickSelect({ baiaId, status }: { baiaId: string; status: Baia["status"] }) {
  return (
    <QuickSelectBadge
      value={status}
      tone={statusTone[status]}
      options={[
        { value: "Ativa", label: "Ativa" },
        { value: "Reprodução", label: "Reprodução" },
        { value: "Inativa", label: "Inativa" },
      ]}
      onCommit={(next) => updateBaiaStatusQuick(baiaId, next)}
    />
  );
}

function DestinoQuickSelect({
  baiaId,
  destino,
}: {
  baiaId: string;
  destino: Baia["destinoPadrao"];
}) {
  return (
    <QuickSelectBadge
      value={destino}
      tone={destinoTone[destino]}
      options={[
        { value: "venda", label: "Destino: Venda" },
        { value: "choc", label: "Destino: Chocadeira" },
        { value: "reservado", label: "Destino: Reservado" },
        { value: "descarte", label: "Destino: Descarte" },
      ]}
      onCommit={(next) => updateBaiaDestinoQuick(baiaId, next)}
    />
  );
}

function BaiaFormSheet({
  open,
  onClose,
  title,
  baia,
  action,
  onViewAves,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  baia?: Baia;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  /** Só existe editando uma baia que já existe — leva pra "Ver aves" (fecha
   * esse painel e abre o outro), pra dar baixa ou excluir uma ave específica
   * quando a quantidade precisa diminuir. */
  onViewAves?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const closedByUs = useRef(false);
  // Só fecha quando "pending" passa de true pra false (depois de uma
  // submissão de verdade) — nunca no mount, onde "pending" já nasce false e
  // bateria a mesma condição sem ninguém ter enviado o formulário.
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error && closedByUs.current === false) {
      // Submissão concluída sem erro: fecha o painel.
      closedByUs.current = true;
      onClose();
    }
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={<SheetSubmitFooter formId="baia-form" pending={pending} label="Salvar baia" />}
    >
      <form ref={formRef} action={formAction} id="baia-form" className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="numero" className="block text-sm font-medium text-brand-ink">
              Número
            </label>
            <input
              id="numero"
              name="numero"
              type="text"
              required
              defaultValue={baia?.numero}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="especie" className="block text-sm font-medium text-brand-ink">
              Espécie
            </label>
            <input
              id="especie"
              name="especie"
              type="text"
              required
              defaultValue={baia?.especie}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-brand-ink">
            Nome (opcional)
          </label>
          <input
            id="nome"
            name="nome"
            type="text"
            placeholder="Gerado automaticamente se deixar em branco"
            defaultValue={baia?.nome}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="setor" className="block text-sm font-medium text-brand-ink">
              Setor (opcional)
            </label>
            <input id="setor" name="setor" type="text" defaultValue={baia?.setor ?? ""} className={inputClass} />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-brand-ink">
              Status
            </label>
            <select id="status" name="status" defaultValue={baia?.status ?? "Ativa"} className={inputClass}>
              <option value="Ativa">Ativa</option>
              <option value="Reprodução">Reprodução</option>
              <option value="Inativa">Inativa</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="preco_ovo" className="block text-sm font-medium text-brand-ink">
              Preço por ovo (R$)
            </label>
            <input
              id="preco_ovo"
              name="preco_ovo"
              type="text"
              inputMode="decimal"
              placeholder="15,00"
              defaultValue={baia?.precoOvo ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="destino_padrao" className="block text-sm font-medium text-brand-ink">
              Destino padrão
            </label>
            <select
              id="destino_padrao"
              name="destino_padrao"
              defaultValue={baia?.destinoPadrao ?? "venda"}
              className={inputClass}
            >
              <option value="venda">Venda</option>
              <option value="choc">Chocadeira</option>
              <option value="reservado">Reservado</option>
              <option value="descarte">Descarte</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="observacoes" className="block text-sm font-medium text-brand-ink">
            Observações gerais (opcional)
          </label>
          <textarea
            id="observacoes"
            name="observacoes"
            rows={3}
            defaultValue={baia?.observacoes ?? ""}
            className={inputClass}
          />
        </div>

        {/* Baia NOVA: dá pra já cadastrar o lote de aves junto, como parte
            desse mesmo formulário/ação (createBaia). */}
        {!baia && (
          <div className="rounded-xl border border-dashed border-brand-sand p-3">
            <p className="text-sm font-medium text-brand-ink">Já cadastrar aves nessa baia (opcional)</p>
            <p className="mt-1 text-xs text-brand-ink/50">
              Cria as aves já vinculadas a essa baia, com o nome da espécie acima — dá pra editar
              nome, anilha etc. depois, uma por uma, no Plantel. Deixe em 0 pra cadastrar as aves
              depois, com calma.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="aves_machos" className="block text-sm font-medium text-brand-ink">
                  Machos
                </label>
                <input
                  id="aves_machos"
                  name="aves_machos"
                  type="number"
                  min={0}
                  defaultValue={0}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="aves_femeas" className="block text-sm font-medium text-brand-ink">
                  Fêmeas
                </label>
                <input
                  id="aves_femeas"
                  name="aves_femeas"
                  type="number"
                  min={0}
                  defaultValue={0}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="mt-3">
              <label htmlFor="aves_status" className="block text-sm font-medium text-brand-ink">
                Status inicial dessas aves
              </label>
              <select id="aves_status" name="aves_status" defaultValue="Disponível" className={inputClass}>
                <option value="Disponível">Disponível (já conta pra venda em Produtos)</option>
                <option value="Reprodutor">Reprodutor</option>
                <option value="Macho reprodutor">Macho reprodutor</option>
                <option value="Fêmea reprodutora">Fêmea reprodutora</option>
                <option value="Matriz">Matriz</option>
                <option value="Filhote">Filhote</option>
              </select>
            </div>
          </div>
        )}

        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
      </form>

      {/* Baia EXISTENTE: a quantidade de aves não é um campo do formulário
          acima (não dá pra "setar um número" sem saber quais aves especificas
          entram ou saem) — aqui dá pra aumentar na hora (mesma lógica do
          cadastro em lote) e, pra diminuir, manda pra "Ver aves" (baixa ou
          exclusão de uma ave específica, ver BaiaAvesSheet). */}
      {baia && (
        <div className="mt-4 rounded-xl border border-dashed border-brand-sand p-3">
          <p className="text-sm font-medium text-brand-ink">Aves nessa baia</p>
          <p className="mt-1 text-xs text-brand-ink/50">
            {baia.totalAves === 0
              ? "Nenhuma ave vinculada ainda."
              : `${baia.totalAves} ave${baia.totalAves === 1 ? "" : "s"} agora · ${baia.machos} macho${baia.machos === 1 ? "" : "s"}, ${baia.femeas} fêmea${baia.femeas === 1 ? "" : "s"}.`}
          </p>

          <AvesQuickAddFields baiaId={baia.id} especie={baia.especie} />

          <button
            type="button"
            onClick={onViewAves}
            className="mt-3 text-sm font-medium text-brand-green hover:underline"
          >
            Ver cada ave (pra dar baixa ou excluir e diminuir a quantidade) →
          </button>
        </div>
      )}
    </Sheet>
  );
}

/** Formulariozinho de "machos + fêmeas + status inicial" pra cadastrar um
 * lote de aves de uma vez, já vinculadas a uma baia — usado tanto dentro do
 * formulário de edição de baia (acima) quanto dentro de "Ver aves"
 * (BaiaAvesSheet, mais abaixo). Sempre a mesma lógica por baixo
 * (createAvesLote), só muda onde aparece na tela. */
function AvesQuickAddFields({
  baiaId,
  especie,
  idPrefix = "qa",
}: {
  baiaId: string;
  especie: string;
  idPrefix?: string;
}) {
  const [machos, setMachos] = useState("0");
  const [femeas, setFemeas] = useState("0");
  const [status, setStatus] = useState<AveStatus>("Disponível");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    setError(null);
    setSuccess(null);
    const qtdMachos = Math.max(0, Math.trunc(Number(machos) || 0));
    const qtdFemeas = Math.max(0, Math.trunc(Number(femeas) || 0));
    startTransition(async () => {
      const result = await createAvesLote(baiaId, especie, qtdMachos, qtdFemeas, status);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(
        `${result.criadas} ave${result.criadas === 1 ? "" : "s"} adicionada${result.criadas === 1 ? "" : "s"}.`,
      );
      setMachos("0");
      setFemeas("0");
    });
  }

  return (
    <div className="mt-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${idPrefix}-machos`} className="block text-sm font-medium text-brand-ink">
            Machos a adicionar
          </label>
          <input
            id={`${idPrefix}-machos`}
            type="number"
            min={0}
            value={machos}
            onChange={(e) => setMachos(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-femeas`} className="block text-sm font-medium text-brand-ink">
            Fêmeas a adicionar
          </label>
          <input
            id={`${idPrefix}-femeas`}
            type="number"
            min={0}
            value={femeas}
            onChange={(e) => setFemeas(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <div className="mt-3">
        <label htmlFor={`${idPrefix}-status`} className="block text-sm font-medium text-brand-ink">
          Status inicial
        </label>
        <select
          id={`${idPrefix}-status`}
          value={status}
          onChange={(e) => setStatus(e.target.value as AveStatus)}
          className={inputClass}
        >
          <option value="Disponível">Disponível (já conta pra venda em Produtos)</option>
          <option value="Reprodutor">Reprodutor</option>
          <option value="Macho reprodutor">Macho reprodutor</option>
          <option value="Fêmea reprodutora">Fêmea reprodutora</option>
          <option value="Matriz">Matriz</option>
          <option value="Filhote">Filhote</option>
        </select>
      </div>
      <p className="mt-2 text-xs text-brand-ink/50">
        Nasce com o nome &quot;{especie}&quot; — edite nome, anilha etc. depois, uma por uma, no
        Plantel.
      </p>
      <button
        type="button"
        disabled={isPending}
        onClick={handleAdd}
        className="mt-3 w-full rounded-full bg-brand-green px-4 py-2 text-sm font-medium text-brand-cream hover:bg-brand-green-dark disabled:opacity-60"
      >
        {isPending ? "Adicionando..." : "Adicionar aves"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
      {success && <p className="mt-2 text-sm text-brand-green">{success}</p>}
    </div>
  );
}

const DESTINO_LABELS: Record<Baia["destinoPadrao"], string> = {
  venda: "Venda (fica disponível)",
  choc: "Chocadeira (incuba, 21 dias)",
  reservado: "Reservado",
  descarte: "Descarte",
};

interface PosturaItemDraft {
  destino: Baia["destinoPadrao"];
  quantidade: string;
}

/** Registro de postura: dá pra lançar quantidades diferentes pra destinos
 * diferentes numa única coleta (ex: "10 pra chocadeira, 20 pra venda") — cada
 * linha aqui vira o próprio lote independente no banco. Começa com uma linha
 * só (o caso mais comum) e "+ Adicionar destino" abre mais quando precisar. */
function PosturaFormSheet({ baia, onClose }: { baia: Baia; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(createPostura, initialState);
  const closedByUs = useRef(false);
  // Só fecha quando "pending" passa de true pra false (depois de uma
  // submissão de verdade) — nunca no mount, onde "pending" já nasce false e
  // bateria a mesma condição assim que o painel abre, sem ninguém ter
  // clicado em "Registrar postura" (esse era o bug: o painel abria e
  // fechava sozinho na mesma hora).
  const wasPending = useRef(false);
  const [itens, setItens] = useState<PosturaItemDraft[]>([
    { destino: baia.destinoPadrao, quantidade: "" },
  ]);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error && closedByUs.current === false) {
      closedByUs.current = true;
      onClose();
    }
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  const today = new Date().toISOString().split("T")[0];
  const itensJson = JSON.stringify(
    itens.map((item) => ({ destino: item.destino, quantidade: Number(item.quantidade) || 0 })),
  );

  function updateItem(index: number, patch: Partial<PosturaItemDraft>) {
    setItens((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItens((prev) => [...prev, { destino: "venda", quantidade: "" }]);
  }

  function removeItem(index: number) {
    setItens((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={`Nova postura — ${baia.nome}`}
      footer={<SheetSubmitFooter formId="postura-form" pending={pending} label="Registrar postura" />}
    >
      <form action={formAction} id="postura-form" className="space-y-4">
        <input type="hidden" name="baia_id" value={baia.id} />
        <input type="hidden" name="itens" value={itensJson} />

        <div className="space-y-3">
          {itens.map((item, index) => (
            <div key={index} className="rounded-xl border border-brand-sand p-3">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor={`quantidade-${index}`}
                  className="text-sm font-medium text-brand-ink"
                >
                  {itens.length > 1 ? `Quantidade #${index + 1}` : "Quantidade de ovos"}
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
                min={1}
                required
                autoFocus={index === 0}
                value={item.quantidade}
                onChange={(e) => updateItem(index, { quantidade: e.target.value })}
                className={inputClass}
              />
              <select
                value={item.destino}
                onChange={(e) => updateItem(index, { destino: e.target.value as Baia["destinoPadrao"] })}
                className={`${inputClass} mt-2`}
                aria-label="Destino"
              >
                {(Object.keys(DESTINO_LABELS) as Baia["destinoPadrao"][]).map((d) => (
                  <option key={d} value={d}>
                    {DESTINO_LABELS[d]}
                  </option>
                ))}
              </select>
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="data_postura" className="block text-sm font-medium text-brand-ink">
              Data
            </label>
            <input
              id="data_postura"
              name="data_postura"
              type="date"
              defaultValue={today}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="preco_unit" className="block text-sm font-medium text-brand-ink">
              Preço/ovo (R$)
            </label>
            <input
              id="preco_unit"
              name="preco_unit"
              type="text"
              inputMode="decimal"
              placeholder={baia.precoOvo !== null ? formatBRL(baia.precoOvo) : "Opcional"}
              className={inputClass}
            />
          </div>
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

function ObsSheet({ baia, onClose }: { baia: Baia; onClose: () => void }) {
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await createObservacao(baia.id, texto);
      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={`Observação — ${baia.nome}`}
      footer={
        <button
          type="button"
          disabled={isPending || !texto.trim()}
          onClick={handleSave}
          className="w-full rounded-full bg-brand-green px-6 py-2.5 text-sm font-medium text-brand-cream hover:bg-brand-green-dark disabled:opacity-60"
        >
          {isPending ? "Salvando..." : "Salvar observação"}
        </button>
      }
    >
      <label htmlFor="obs-texto" className="block text-sm font-medium text-brand-ink">
        O que aconteceu?
      </label>
      <textarea
        id="obs-texto"
        rows={5}
        autoFocus
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Ex: Troca de macho reprodutor, ave doente isolada..."
        className={inputClass}
      />
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </Sheet>
  );
}

const AVE_STATUS_TONE: Record<AveStatus, BadgeTone> = {
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

/** Mostra quem está vinculado a essa baia agora (nome, anilha, status) sem
 * precisar ir até o Plantel e filtrar/buscar por lá — essa lista é a mesma
 * usada pra calcular a contagem do card (aves "Vendido"/"Óbito" já não
 * aparecem aqui nem lá, a baixa propaga pros dois lugares igual). Também
 * tem o atalho "Adicionar aves", pra cadastrar mais um lote (machos/fêmeas)
 * sem precisar ir até o Plantel — mesma lógica usada ao criar uma baia nova
 * com aves já dentro (ver BaiaFormSheet, acima). */
function BaiaAvesSheet({ baia, aves, onClose }: { baia: Baia; aves: Ave[]; onClose: () => void }) {
  const [addOpen, setAddOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRemove(ave: Ave) {
    if (
      !window.confirm(
        `Excluir "${ave.nome}" (${ave.codigo}) do Plantel? Essa ação não pode ser desfeita. Se ela já foi vendida ou morreu, prefira "Dar baixa" em vez de excluir, pra manter o histórico.`,
      )
    ) {
      return;
    }
    setRemovingId(ave.id);
    startTransition(async () => {
      await deleteAve(ave.id);
      setRemovingId(null);
    });
  }

  return (
    <Sheet open onClose={onClose} title={`Aves — ${baia.nome}`}>
      <p className="text-sm text-brand-ink/60">
        {aves.length === 0
          ? "Nenhuma ave vinculada a essa baia ainda."
          : `${aves.length} ave${aves.length === 1 ? "" : "s"} vinculada${aves.length === 1 ? "" : "s"} — sempre em dia com o Plantel, em tempo real.`}
      </p>

      <button
        type="button"
        onClick={() => setAddOpen((v) => !v)}
        className="mt-3 flex items-center gap-1.5 text-sm font-medium text-brand-green hover:underline"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        Adicionar aves
      </button>

      {addOpen && (
        <div className="mt-3 rounded-xl border border-brand-sand p-3">
          <AvesQuickAddFields baiaId={baia.id} especie={baia.especie} idPrefix="add-aves" />
        </div>
      )}

      {aves.length > 0 && (
        <ul className="mt-4 divide-y divide-brand-sand/60">
          {aves.map((ave) => (
            <li key={ave.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-brand-ink">{ave.nome}</p>
                <p className="truncate text-xs text-brand-ink/50">
                  {ave.codigo}
                  {ave.anilha ? ` · Anilha ${ave.anilha}` : " · Sem anilha"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Badge tone="neutral">{ave.sexo}</Badge>
                <Badge tone={AVE_STATUS_TONE[ave.status]}>{ave.status}</Badge>
                <button
                  type="button"
                  disabled={isPending && removingId === ave.id}
                  onClick={() => handleRemove(ave)}
                  aria-label={`Excluir ${ave.nome}`}
                  title="Excluir do Plantel (diminui a quantidade)"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-brand-ink/40 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                >
                  {isPending && removingId === ave.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/admin/aves"
        onClick={onClose}
        className="mt-5 inline-block text-sm font-medium text-brand-green hover:underline"
      >
        Ver/editar tudo no Plantel →
      </Link>
    </Sheet>
  );
}

/** Gráfico de postura por data, só dessa baia — pra visualizar rápido o
 * ritmo de produção (todos os destinos somados: venda, chocadeira,
 * reservado e descarte). */
function BaiaGraficoSheet({
  baia,
  lotes,
  onClose,
}: {
  baia: Baia;
  lotes: LotePostura[];
  onClose: () => void;
}) {
  const [periodo, setPeriodo] = useState<30 | 90>(30);
  const serie = useMemo(() => buildDailySeries(lotes, periodo), [lotes, periodo]);
  const total = serie.reduce((sum, d) => sum + d.quantidade, 0);
  const diasComPostura = serie.filter((d) => d.quantidade > 0).length;

  return (
    <Sheet open onClose={onClose} title={`Postura — ${baia.nome}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-brand-ink/60">
          {total === 0
            ? `Nenhuma postura registrada nos últimos ${periodo} dias.`
            : `${total} ovo${total === 1 ? "" : "s"} em ${diasComPostura} dia${diasComPostura === 1 ? "" : "s"} com coleta.`}
        </p>
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

      <div className="mt-4 rounded-xl border border-brand-sand/70 bg-white p-3">
        <PosturaBarChart data={serie} />
      </div>

      <p className="mt-3 text-xs text-brand-ink/40">
        Soma todos os destinos (venda, chocadeira, reservado e descarte) de cada dia de coleta
        dessa baia. Passe o mouse (ou toque) numa barra pra ver a data e a quantidade exata.
      </p>
    </Sheet>
  );
}

function SheetSubmitFooter({
  formId,
  pending,
  label,
}: {
  formId: string;
  pending: boolean;
  label: string;
}) {
  return (
    <button
      type="submit"
      form={formId}
      disabled={pending}
      className={cn(
        "w-full rounded-full bg-brand-green px-6 py-2.5 text-sm font-medium text-brand-cream hover:bg-brand-green-dark disabled:opacity-60",
      )}
    >
      {pending ? "Salvando..." : label}
    </button>
  );
}
