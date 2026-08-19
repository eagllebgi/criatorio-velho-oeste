"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { ImageOff, Pencil, Trash2 } from "lucide-react";
import { formatBRL } from "@/lib/utils";
import type { Product } from "@/lib/types/domain";
import { Badge } from "@/components/ui/Badge";
import {
  deleteProduct,
  toggleProductActive,
} from "@/app/(admin)/admin/(protected)/produtos/actions";

export function AdminProductTable({ products }: { products: Product[] }) {
  const [isPending, startTransition] = useTransition();

  function handleToggleActive(id: string, next: boolean) {
    startTransition(() => toggleProductActive(id, next));
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
                <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-brand-sand">
                  {product.mainImage ? (
                    <Image
                      src={product.mainImage}
                      alt={product.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-brand-brown/30">
                      <ImageOff className="h-4 w-4" aria-hidden="true" />
                    </div>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 font-medium text-brand-ink">{product.name}</td>
              <td className="px-4 py-3 text-brand-ink/70">
                {product.categoryName ?? "—"}
              </td>
              <td className="px-4 py-3 text-brand-ink/70">{formatBRL(product.price)}</td>
              <td className="px-4 py-3 text-brand-ink/70">{product.stock}</td>
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
                {product.featured ? <Badge tone="gold">Sim</Badge> : <Badge tone="neutral">Não</Badge>}
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
