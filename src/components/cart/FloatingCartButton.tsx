"use client";

import { ShoppingBasket } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";
import { cn } from "@/lib/utils";

/**
 * Botão flutuante do carrinho, fixo no canto da tela enquanto a pessoa
 * navega pelo catálogo. Some quando o carrinho está vazio (nada a mostrar)
 * e aparece com uma transição suave assim que o primeiro item é adicionado.
 */
export function FloatingCartButton() {
  const { itemCount, openDrawer } = useCart();
  const hasItems = itemCount > 0;

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label={`Ver pedido${hasItems ? `, ${itemCount} itens` : ""}`}
      aria-hidden={!hasItems}
      tabIndex={hasItems ? 0 : -1}
      className={cn(
        "fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-brand-green py-3 pl-4 pr-5 text-white shadow-lg shadow-brand-ink/20 transition-all duration-300 ease-out hover:bg-brand-green-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green sm:bottom-8 sm:right-8",
        hasItems
          ? "translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-y-3 scale-95 opacity-0",
      )}
    >
      <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
        <ShoppingBasket className="h-6 w-6" aria-hidden="true" />
        {hasItems && (
          <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-gold px-1 text-[0.7rem] font-semibold text-brand-ink">
            {itemCount}
          </span>
        )}
      </span>
      <span className="text-sm font-semibold">Ver pedido</span>
    </button>
  );
}
