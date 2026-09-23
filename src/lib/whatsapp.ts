import { siteConfig } from "@/lib/config/site";
import { formatBRL } from "@/lib/utils";
import type { CartItem } from "@/lib/cart/types";

function itemSubtotal(item: CartItem): number | null {
  if (item.price === null) return null;
  return item.price * item.quantity;
}

export function getCartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + (itemSubtotal(item) ?? 0), 0);
}

function unitLabel(item: CartItem): string {
  if (item.productType === "ave") return item.quantity === 1 ? "ave" : "aves";
  return item.quantity === 1 ? "ovo" : "ovos";
}

function itemEmoji(item: CartItem): string {
  return item.productType === "ave" ? "🐔" : "🥚";
}

export function buildOrderMessage(items: CartItem[], cep: string): string {
  const lines: string[] = [];

  lines.push(
    `Olá! Vim pelo site do ${siteConfig.name} e gostaria de solicitar estes itens:`,
  );
  lines.push("");

  for (const item of items) {
    const subtotal = itemSubtotal(item);
    lines.push(`${itemEmoji(item)} ${item.name}`);
    lines.push(`Quantidade: ${item.quantity} ${unitLabel(item)}`);
    lines.push(
      `Valor unitário: ${item.price !== null ? formatBRL(item.price) : "a confirmar"}`,
    );
    lines.push(
      `Subtotal: ${subtotal !== null ? formatBRL(subtotal) : "a confirmar"}`,
    );
    lines.push("");
  }

  if (cep) {
    lines.push("📦 CEP para entrega:");
    lines.push(cep);
    lines.push("");
  }

  lines.push("💰 Subtotal do pedido:");
  lines.push(formatBRL(getCartSubtotal(items)));
  lines.push("");
  lines.push("Gostaria de confirmar a disponibilidade e o valor do envio.");
  lines.push("");
  lines.push("Obrigado!");

  return lines.join("\n");
}

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${siteConfig.whatsapp.number}?text=${encodeURIComponent(message)}`;
}
