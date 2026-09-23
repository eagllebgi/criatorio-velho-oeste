"use client";

import { useState } from "react";
import { X, ShoppingBasket } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { CepInput } from "@/components/cart/CepInput";
import { Button } from "@/components/ui/Button";
import { formatBRL } from "@/lib/utils";
import { buildOrderMessage, buildWhatsAppUrl, getCartSubtotal } from "@/lib/whatsapp";
import { isValidCepFormat } from "@/lib/cep";
import { trackEvent } from "@/lib/analytics/events";

export function CartDrawer() {
  const { items, isDrawerOpen, closeDrawer, clear } = useCart();
  const [cep, setCep] = useState("");
  const [showCepError, setShowCepError] = useState(false);

  if (!isDrawerOpen) return null;

  const subtotal = getCartSubtotal(items);
  const hasItems = items.length > 0;

  function handleContinue() {
    if (!isValidCepFormat(cep)) {
      setShowCepError(true);
      return;
    }

    trackEvent("begin_whatsapp_order", { item_count: items.length, subtotal });
    const message = buildOrderMessage(items, cep);
    const url = buildWhatsAppUrl(message);
    trackEvent("whatsapp_click", { item_count: items.length, subtotal });
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Fechar pedido"
        onClick={closeDrawer}
        className="absolute inset-0 bg-brand-ink/40 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Seu pedido"
        className="relative flex h-full w-full max-w-md flex-col bg-brand-cream shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-brand-sand px-5 py-4">
          <h2 className="font-serif text-lg font-semibold text-brand-ink">Seu pedido</h2>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Fechar"
            className="flex h-9 w-9 items-center justify-center rounded-full text-brand-ink/60 hover:bg-brand-ink/5"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {!hasItems ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBasket className="h-10 w-10 text-brand-brown/40" aria-hidden="true" />
            <p className="text-sm text-brand-ink/60">
              Seu pedido está vazio. Escolha os ovos ou aves que deseja e
              adicione aqui.
            </p>
            <Button href="/ovos" onClick={closeDrawer}>
              Ver disponíveis
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-brand-sand overflow-y-auto px-5">
              {items.map((item) => (
                <CartItemRow key={item.productId} item={item} />
              ))}
            </ul>

            <div className="space-y-4 border-t border-brand-sand px-5 py-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-brand-ink/70">Subtotal do pedido</span>
                <span className="text-base font-semibold text-brand-ink">
                  {formatBRL(subtotal)}
                </span>
              </div>
              <p className="text-xs text-brand-ink/50">
                O valor do envio será confirmado pelo atendimento.
              </p>

              <CepInput
                value={cep}
                onChange={(v) => {
                  setCep(v);
                  setShowCepError(false);
                }}
              />
              {showCepError && (
                <p className="text-xs text-red-600">
                  Informe o CEP de entrega para continuar.
                </p>
              )}

              <Button size="lg" className="w-full" onClick={handleContinue}>
                Continuar pelo WhatsApp
              </Button>
              <button
                type="button"
                onClick={clear}
                className="w-full text-center text-xs text-brand-ink/50 underline-offset-2 hover:underline"
              >
                Esvaziar pedido
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
