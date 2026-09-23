"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { formatBRL } from "@/lib/utils";
import { useCart } from "@/lib/cart/cart-context";
import type { CartItem } from "@/lib/cart/types";

export function CartItemRow({ item }: { item: CartItem }) {
  const { updateQuantity, removeItem } = useCart();
  const subtotal = item.price !== null ? item.price * item.quantity : null;

  return (
    <li className="flex gap-3 py-4">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-brand-sand">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium text-brand-ink">{item.name}</span>
          <button
            type="button"
            onClick={() => removeItem(item.productId)}
            aria-label={`Remover ${item.name} do pedido`}
            className="shrink-0 text-brand-ink/40 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <span className="text-xs text-brand-ink/60">
          {item.price !== null
            ? `${formatBRL(item.price)} / ${item.productType === "ave" ? "ave" : "ovo"}`
            : "Preço a confirmar"}
        </span>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1 rounded-full border border-brand-sand">
            <button
              type="button"
              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-brand-green hover:bg-brand-green/10"
              aria-label="Diminuir quantidade"
            >
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <span className="min-w-6 text-center text-sm font-medium" aria-live="polite">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              disabled={item.quantity >= item.stock}
              className="flex h-7 w-7 items-center justify-center rounded-full text-brand-green hover:bg-brand-green/10 disabled:opacity-30"
              aria-label="Aumentar quantidade"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <span className="text-sm font-semibold text-brand-ink">
            {subtotal !== null ? formatBRL(subtotal) : "—"}
          </span>
        </div>
      </div>
    </li>
  );
}
