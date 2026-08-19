"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ImageOff } from "lucide-react";
import { formatBRL } from "@/lib/utils";
import { getStockStatus } from "@/lib/types/domain";
import type { Product } from "@/lib/types/domain";
import { useCart } from "@/lib/cart/cart-context";
import { QuantitySelector } from "@/components/catalog/QuantitySelector";
import { StockBadge } from "@/components/catalog/StockBadge";
import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/analytics/events";

export function ProductCard({ product }: { product: Product }) {
  const { addItem, openDrawer } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const status = getStockStatus(product);
  const isOut = status.level === "out";

  function handleAdd() {
    addItem(
      {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: product.mainImage,
        stock: product.stock,
      },
      quantity,
    );
    trackEvent("view_product", { product_id: product.id });
    setJustAdded(true);
    setQuantity(1);
    setTimeout(() => setJustAdded(false), 1600);
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-brand-sand/70 bg-white transition-shadow hover:shadow-lg hover:shadow-brand-green/5">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-sand">
        {product.mainImage ? (
          <Image
            src={product.mainImage}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 23vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-brand-brown/30">
            <ImageOff className="h-8 w-8" aria-hidden="true" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <StockBadge stock={product.stock} lowStockThreshold={product.lowStockThreshold} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        {product.categoryName && (
          <span className="text-xs font-medium uppercase tracking-wide text-brand-brown/70">
            {product.categoryName}
          </span>
        )}
        <h3 className="font-serif text-lg font-semibold text-brand-ink">
          <Link href={`/ovos/${product.slug}`} className="hover:text-brand-green">
            {product.name}
          </Link>
        </h3>
        {product.shortDescription && (
          <p className="text-sm text-brand-ink/60">{product.shortDescription}</p>
        )}

        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-lg font-semibold text-brand-green">
            {formatBRL(product.price)}
          </span>
          {product.price !== null && <span className="text-xs text-brand-ink/50">/ ovo</span>}
        </div>

        {!isOut && (
          <span className="text-xs text-brand-ink/50">
            Disponíveis: {product.stock} ovos
          </span>
        )}

        <div className="mt-auto flex items-center gap-2 pt-3">
          {!isOut && (
            <QuantitySelector value={quantity} max={product.stock} onChange={setQuantity} />
          )}
          <Button
            onClick={handleAdd}
            disabled={isOut}
            size="sm"
            className="flex-1"
            variant={justAdded ? "secondary" : "primary"}
          >
            {isOut ? (
              "Indisponível"
            ) : justAdded ? (
              <>
                <Check className="h-4 w-4" aria-hidden="true" /> Adicionado
              </>
            ) : (
              "Adicionar ao pedido"
            )}
          </Button>
        </div>
        {justAdded && (
          <button
            type="button"
            onClick={openDrawer}
            className="text-center text-xs font-medium text-brand-green underline-offset-2 hover:underline"
          >
            Ver pedido
          </button>
        )}
      </div>
    </div>
  );
}
