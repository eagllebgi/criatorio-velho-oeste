"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { ImageOff, Loader2, Pencil, Search, Trash2 } from "lucide-react";
import type { Product, ProductType } from "@/lib/types/domain";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { buildProductImagePath } from "@/lib/storage";
import { ImageCropModal } from "@/components/admin/ImageCropModal";
import { parsePriceInput, toPriceInputValue } from "@/lib/utils";
import {
  deleteProduct,
  toggleProductActive,
  toggleProductFeatured,
} from "@/app/(admin)/admin/(protected)/produtos/actions";
import { updateProductPriceQuick, updateProductStockQuick } from "@/lib/actions/products";

const BUCKET = "product-images";

type TipoFilter = "todos" | ProductType;

export function AdminProductTable({ products }: { products: Product[] }) {
  const [isPending, startTransition] = useTransition();
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>("todos");
  const [search, setSearch] = useState("");

  const counts = useMemo(
    () => ({
      todos: products.length,
      ovo: products.filter((p) => p.productType === "ovo").length,
      ave: products.filter((p) => p.productType === "ave").length,
    }),
    [products],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      if (tipoFilter !== "todos" && p.productType !== tipoFilter) return false;
      if (!term) return true;
      return (
        p.name.toLowerCase().includes(term) || (p.categoryName ?? "").toLowerCase().includes(term)
      );
    });
  }, [products, tipoFilter, search]);

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

  const searchBox = (
    <div className="relative mb-4 max-w-xs">
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/40"
        aria-hidden="true"
      />
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por raça ou categoria..."
        className="w-full rounded-full border border-brand-sand bg-white py-2.5 pl-10 pr-4 text-sm text-brand-ink outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
      />
    </div>
  );

  const filterTabs = (
    <div className="mb-4 flex flex-wrap gap-2">
      {(
        [
          { key: "todos" as const, label: `Todos (${counts.todos})` },
          { key: "ovo" as const, label: `Ovos (${counts.ovo})` },
          { key: "ave" as const, label: `Aves (${counts.ave})` },
        ] satisfies { key: TipoFilter; label: string }[]
      ).map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => setTipoFilter(tab.key)}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            tipoFilter === tab.key
              ? "border-brand-green bg-brand-green text-brand-cream"
              : "border-brand-sand bg-white text-brand-ink/70 hover:border-brand-green/50",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  if (products.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-brand-sand bg-white p-10 text-center text-sm text-brand-ink/60">
        Nenhum produto cadastrado ainda.
      </p>
    );
  }

  return (
    <>
      {searchBox}
      {filterTabs}

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-brand-sand bg-white p-10 text-center text-sm text-brand-ink/60">
          {search.trim() ? "Nenhum item encontrado pra essa busca." : "Nenhum item desse tipo cadastrado."}
        </p>
      ) : (
        <>
      {/* Tabela completa: só a partir de lg, onde as 8 colunas cabem sem
          precisar rolar de lado. Em telas menores, a lista de cards abaixo
          assume — antes o celular só tinha essa tabela com rolagem
          horizontal, o que era ruim de usar. */}
      <div className="hidden overflow-x-auto rounded-2xl border border-brand-sand/70 bg-white lg:block">
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
            {filtered.map((product) => (
              <tr key={product.id} className="align-middle">
                <td className="px-4 py-3">
                  <PhotoCell productId={product.id} name={product.name} mainImage={product.mainImage} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-brand-ink">{product.name}</span>
                    <Badge tone={product.productType === "ave" ? "gold" : "neutral"}>
                      {product.productType === "ave" ? "Ave" : "Ovo"}
                    </Badge>
                  </div>
                </td>
                <td className="px-4 py-3 text-brand-ink/70">
                  {product.categoryName ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <PriceCell productId={product.id} price={product.price} />
                </td>
                <td className="px-4 py-3">
                  <StockCell
                    productId={product.id}
                    stock={product.stock}
                    productType={product.productType}
                  />
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

      {/* Versão em cards: abaixo de lg (celular e tablet em pé). Mesmas
          ações da tabela, só que empilhadas de um jeito fácil de tocar. */}
      <div className="flex flex-col gap-3 lg:hidden">
        {filtered.map((product) => (
          <div key={product.id} className="rounded-2xl border border-brand-sand/70 bg-white p-3.5">
            <div className="flex gap-3">
              <PhotoCell productId={product.id} name={product.name} mainImage={product.mainImage} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-medium text-brand-ink">{product.name}</p>
                      <Badge tone={product.productType === "ave" ? "gold" : "neutral"} className="shrink-0">
                        {product.productType === "ave" ? "Ave" : "Ovo"}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-brand-ink/50">
                      {product.categoryName ?? "Sem categoria"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
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
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                  <PriceCell productId={product.id} price={product.price} />
                  <StockCell
                    productId={product.id}
                    stock={product.stock}
                    productType={product.productType}
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 border-t border-brand-sand/60 pt-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleToggleActive(product.id, !product.active)}
              >
                <Badge tone={product.active ? "available" : "neutral"}>
                  {product.active ? "Ativo" : "Inativo"}
                </Badge>
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleToggleFeatured(product.id, !product.featured)}
              >
                <Badge tone={product.featured ? "gold" : "neutral"}>
                  {product.featured ? "Em destaque" : "Sem destaque"}
                </Badge>
              </button>
            </div>
          </div>
        ))}
      </div>
        </>
      )}
    </>
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

/** Estoque editável direto na linha: digita, ou usa os botões -/+, salva sozinho.
 * Pra raça "Ave", o estoque é calculado sozinho a partir do Plantel (ver
 * 0008_postura_login_ave_stock.sql) — aqui só mostra o número, sem editar. */
function StockCell({
  productId,
  stock,
  productType,
}: {
  productId: string;
  stock: number;
  productType: Product["productType"];
}) {
  if (productType === "ave") {
    return (
      <span
        title="Calculado automaticamente pelo Plantel"
        className="inline-flex items-center gap-1 text-sm text-brand-ink/70"
      >
        {stock} <span className="text-xs text-brand-ink/40">(Plantel)</span>
      </span>
    );
  }

  return <StockCellEditable productId={productId} stock={stock} />;
}

function StockCellEditable({ productId, stock }: { productId: string; stock: number }) {
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
      const path = buildProductImagePath(productId, "foto.jpg");
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { upsert: false, contentType: "image/jpeg" });
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
    <>
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
          onChange={(e) => {
            handleFile(e.target.files);
            e.target.value = "";
          }}
        />
        {error && (
          <span className="absolute left-1/2 top-full z-10 mt-1 w-max max-w-[10rem] -translate-x-1/2 rounded-md bg-red-600 px-2 py-1 text-[0.65rem] text-white">
            {error}
          </span>
        )}
      </label>

      {pendingFile && (
        <ImageCropModal
          file={pendingFile}
          aspect={1}
          title="Ajustar foto da raça"
          onCancel={() => setPendingFile(null)}
          onCropped={handleCropped}
        />
      )}
    </>
  );
}
