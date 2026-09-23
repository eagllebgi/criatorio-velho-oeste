"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { Product } from "@/lib/types/domain";
import { getStockStatus } from "@/lib/types/domain";
import { useCart } from "@/lib/cart/cart-context";
import { QuantitySelector } from "@/components/catalog/QuantitySelector";
import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/analytics/events";

export function ProductDetailPurchase({ product }: { product: Product }) {
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
        productType: product.productType,
      },
      quantity,
    );
    trackEvent("view_product", { product_id: product.id });
    setJustAdded(true);
    setQuantity(1);
    setTimeout(() => setJustAdded(false), 1600);
  }

  if (isOut) {
    return (
      <Button disabled size="lg" className="w-full sm:w-auto">
        Indisponível
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <QuantitySelector value={quantity} max={product.stock} onChange={setQuantity} />
      <Button
        onClick={handleAdd}
        size="lg"
        variant={justAdded ? "secondary" : "primary"}
        className="sm:w-auto"
      >
        {justAdded ? (
          <>
            <Check className="h-4 w-4" aria-hidden="true" /> Adicionado ao pedido
          </>
        ) : (
          "Adicionar ao pedido"
        )}
      </Button>
      {justAdded && (
        <button
          type="button"
          onClick={openDrawer}
          className="text-left text-sm font-medium text-brand-green underline-offset-2 hover:underline"
        >
          Ver pedido
        </button>
      )}
    </div>
  );
}
