"use client";

import { ShoppingBasket } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";

export function CartButton() {
  const { itemCount, openDrawer } = useCart();

  return (
    <button
      type="button"
      onClick={openDrawer}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-brand-green transition-colors hover:bg-brand-green/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green"
      aria-label={`Ver pedido${itemCount > 0 ? `, ${itemCount} itens` : ""}`}
    >
      <ShoppingBasket className="h-5 w-5" aria-hidden="true" />
      {itemCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-gold px-1 text-[0.7rem] font-semibold text-brand-ink">
          {itemCount}
        </span>
      )}
    </button>
  );
}
