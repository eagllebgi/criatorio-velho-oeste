"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { ImageOff, Loader2, Pencil, Trash2 } from "lucide-react";
import type { Product } from "@/lib/types/domain";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import { buildProductImagePath } from "@/lib/storage";
import {
  deleteProduct,
  toggleProductActive,
  toggleProductFeatured,
  updateProductPriceQuick,
} from "@/app/(admin)/admin/(protected)/produtos/actions";
import { updateProductStockQuick } from "@/lib/actions/products";

const BUCKET = "product-images";

function parsePriceInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function toPriceInputValue(price: number | null): string {
  if (price === null) return "";
  return price.toFixed(2).replace(".", ",");
}

export function AdminProductTable({ products }: { products: Product[] }) {
  const [isPending, startTransition] = useTransition();

  function handleToggleActive(id: string, next: boolean) {
    startTransition(() => toggleProductActive(id, next));
  }

  function handleToggleFeatured(id: string, next: boolean) {
    startTransition(() => toggleProductFeatured(id, next));
  }

  function handleDelete(id: string, name: string) {
    if (!window.confirm(`Excluir "${name}" permanentemente? Esta ação não pode ser desfeita.`)) {
      return;
    }
    startTransition(() => deleteProduct(id));
  }

  if (products.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-brand-sand bg-white p-10 text-center text-sm text-brand-ink/60">
        Nenhum produto cadastrado ainda.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-brand-sand/70 bg-white">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="border-b border-brand-sand/70 bg-brand-cream-dark/40 text-xs uppercase tracking-wide text-brand-ink/50">
          <tr>
            <th className="px-4 py-3 font-medium">Foto</th>
            <th className="px-4 py-3 font-medium">Raça</th>
            <th className="px-4 py-3 font-medium">Categoria</th>
            <th className="px-4 py-3 font-medium">Preço</th>
            <th className="px-4 py-3 font-medium">Estoque</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Destaque</th>
            <th className="px-4 py-3 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-sand/60">
          {products.map((product) => (
            <tr key={product.id} className="align-middle">
              <td className="px-4 py-3">
                <PhotoCell productId={product.id} name={product.name} mainImage={product.mainImage} />
              </td>
              <td className="px-4 py-3 font-medium text-brand-ink">{product.name}</td>
              <td className="px-4 py-3 text-brand-ink/70">
                {product.categoryName ?? "—"}
              </td>
              <td className="px-4 py-3">
                <PriceCell productId={product.id} price={product.price} />
              </td>
              <td className="px-4 py-3">
                <StockCell productId={product.id} stock={product.stock} />
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleToggleActive(product.id, !product.active)}
                >
                  <Badge tone={product.active ? "available" : "neutral"}>
                    {product.active ? "Ativo" : "Inativo"}
                  </Badge>
                </button>
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleToggleFeatured(product.id, !product.featured)}
                >
                  <Badge tone={product.featured ? "gold" : "neutral"}>
                    {product.featured ? "Sim" : "Não"}
                  </Badge>
                </button>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/admin/produtos/${product.id}`}
                    aria-label={`Editar ${product.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-brand-green hover:bg-brand-green/10"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDelete(product.id, product.name)}
                    aria-label={`Excluir ${product.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-brand-ink/50 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Preço editável direto na linha: digita e sai do campo (ou Enter) pra salvar. */
function PriceCell({ productId, price }: { productId: string; price: number | null }) {
  const [value, setValue] = useState(() => toPriceInputValue(price));
  const [isPending, startTransition] = useTransition();

  function commit() {
    const parsed = parsePriceInput(value);
    if (parsed === price) return;
    startTransition(async () => {
      await updateProductPriceQuick(productId, parsed);
    });
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-brand-ink/40">R$</span>
      <input
        type="text"
        inputMode="decimal"
        placeholder="Consultar"
        value={value}
        disabled={isPending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="w-20 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm text-brand-ink/80 outline-none hover:border-brand-sand focus:border-brand-green focus:bg-white focus:ring-1 focus:ring-brand-green"
      />
      {isPending && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-brand-ink/40" aria-hidden="true" />}
    </div>
  );
}

/** Estoque editável direto na linha: digita, ou usa os botões -/+, salva sozinho. */
function StockCell({ productId, stock }: { productId: string; stock: number }) {
  const [value, setValue] = useState(stock);
  const [isPending, startTransition] = useTransition();

  function commit(next: number) {
    const safe = Math.max(0, next);
    setValue(safe);
    if (safe === stock) return;
    startTransition(async () => {
      await updateProductStockQuick(productId, safe);
    });
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() => commit(value - 1)}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-brand-sand text-xs text-brand-ink/60 hover:border-brand-green hover:text-brand-green disabled:opacity-50"
        aria-label="Diminuir estoque"
      >
        −
      </button>
      <input
        type="number"
        min={0}
        value={value}
        disabled={isPending}
        onChange={(e) => setValue(Number(e.target.value))}
        onBlur={() => commit(value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="w-12 rounded-lg border border-transparent bg-transparent px-1 py-1 text-center text-sm text-brand-ink/80 outline-none hover:border-brand-sand focus:border-brand-green focus:bg-white focus:ring-1 focus:ring-brand-green"
      />
      <button
        type="button"
        disabled={isPending}
        onClick={() => commit(value + 1)}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-brand-sand text-xs text-brand-ink/60 hover:border-brand-green hover:text-brand-green disabled:opacity-50"
        aria-label="Aumentar estoque"
      >
        +
      </button>
      {isPending && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-brand-ink/40" aria-hidden="true" />}
    </div>
  );
}

/** Clica na miniatura pra trocar a foto principal, sem abrir a página de edição. */
function PhotoCell({
  productId,
  name,
  mainImage,
}: {
  productId: string;
  name: string;
  mainImage: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(mainImage);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    const supabase = createClient();

    try {
      const path = buildProductImagePath(productId, file.name);
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const url = publicUrlData.publicUrl;

      const { error: insertError } = await supabase
        .from("product_images")
        .insert({ product_id: productId, image_url: url, display_order: 0 });
      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from("products")
        .update({ main_image: url })
        .eq("id", productId);
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
    <label
      title="Clique para trocar a foto principal"
      className="group relative block h-12 w-12 cursor-pointer overflow-hidden rounded-lg bg-brand-sand"
    >
      {preview ? (
        <Image src={preview} alt={name} fill sizes="48px" className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-brand-brown/30">
          <ImageOff className="h-4 w-4" aria-hidden="true" />
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden="true" />
        ) : (
          <Pencil className="h-3.5 w-3.5 text-white opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files)}
      />
      {error && (
        <span className="absolute left-1/2 top-full z-10 mt-1 w-max max-w-[10rem] -translate-x-1/2 rounded-md bg-red-600 px-2 py-1 text-[0.65rem] text-white">
          {error}
        </span>
      )}
    </label>
  );
}
