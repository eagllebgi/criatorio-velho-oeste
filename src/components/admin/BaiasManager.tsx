"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { ChevronDown, Egg, Loader2, MessageSquarePlus, Pencil, Plus, Trash2, Users } from "lucide-react";
import { emojiForEspecie, type Baia } from "@/lib/types/domain";
import { Badge, badgeToneClasses, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { cn, formatBRL } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { buildBaiaImagePath } from "@/lib/storage";
import { ImageCropModal } from "@/components/admin/ImageCropModal";
import { BaiaQrCode } from "@/components/admin/BaiaQrCode";
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

export function BaiasManager({
  baias,
  qrDataUrls,
}: {
  baias: Baia[];
  /** PNG (data URI) do QR Code de coleta de cada baia, já gerado no servidor
   * (page.tsx) — mapeado por baia.id. */
  qrDataUrls: Record<string, string>;
}) {
  const [novaOpen, setNovaOpen] = useState(false);
  const [editing, setEditing] = useState<Baia | null>(null);
  const [posturaFor, setPosturaFor] = useState<Baia | null>(null);
  const [obsFor, setObsFor] = useState<Baia | null>(null);
  const [isPending, startTransition] = useTransition();

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
      <div className="flex justify-end">
        <Button onClick={() => setNovaOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nova baia
        </Button>
      </div>

      {baias.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-brand-sand bg-white p-10 text-center text-sm text-brand-ink/60">
          Nenhuma baia cadastrada ainda.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {baias.map((baia) => (
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
                  sempre batendo com o que está cadastrado em Plantel. */}
              <p className="mt-2.5 flex items-center gap-1.5 text-xs text-brand-ink/60">
                <Users className="h-3.5 w-3.5 shrink-0 text-brand-ink/40" aria-hidden="true" />
                {baia.totalAves === 0
                  ? "0 aves"
                  : `${baia.totalAves} ave${baia.totalAves === 1 ? "" : "s"} · ${baia.machos} macho${baia.machos === 1 ? "" : "s"}, ${baia.femeas} fêmea${baia.femeas === 1 ? "" : "s"}`}
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2">
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
        />
      )}

      {posturaFor && (
        <PosturaFormSheet baia={posturaFor} onClose={() => setPosturaFor(null)} />
      )}

      {obsFor && <ObsSheet baia={obsFor} onClose={() => setObsFor(null)} />}
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
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  baia?: Baia;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const closedByUs = useRef(false);

  useEffect(() => {
    if (!pending && !state.error && closedByUs.current === false && formRef.current) {
      // Submissão concluída sem erro: fecha o painel.
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

        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
      </form>
    </Sheet>
  );
}

function PosturaFormSheet({ baia, onClose }: { baia: Baia; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(createPostura, initialState);
  const closedByUs = useRef(false);

  useEffect(() => {
    if (!pending && !state.error && closedByUs.current === false) {
      closedByUs.current = true;
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <Sheet
      open
      onClose={onClose}
      title={`Nova postura — ${baia.nome}`}
      footer={<SheetSubmitFooter formId="postura-form" pending={pending} label="Registrar postura" />}
    >
      <form action={formAction} id="postura-form" className="space-y-4">
        <input type="hidden" name="baia_id" value={baia.id} />

        <div>
          <label htmlFor="quantidade" className="block text-sm font-medium text-brand-ink">
            Quantidade de ovos
          </label>
          <input
            id="quantidade"
            name="quantidade"
            type="number"
            min={1}
            required
            autoFocus
            className={inputClass}
          />
        </div>

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

        <div>
          <label htmlFor="destino" className="block text-sm font-medium text-brand-ink">
            Destino
          </label>
          <select id="destino" name="destino" defaultValue={baia.destinoPadrao} className={inputClass}>
            <option value="venda">Venda (fica disponível)</option>
            <option value="choc">Chocadeira (incuba, 21 dias)</option>
            <option value="reservado">Reservado</option>
            <option value="descarte">Descarte</option>
          </select>
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
