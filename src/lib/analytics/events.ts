/**
 * Camada fina de rastreamento de eventos. Cada evento vai para o dataLayer
 * (Google Analytics / GTM, se instalados) e, quando houver equivalente, para
 * o Pixel da Meta (components/analytics/MetaPixel.tsx). Nunca lança erro e
 * nunca bloqueia a interação do usuário.
 */

export type AnalyticsEventName =
  | "view_product"
  | "add_to_cart"
  | "remove_from_cart"
  | "begin_whatsapp_order"
  | "whatsapp_click"
  | "group_join_click";

// Evento padrão do Pixel da Meta correspondente a cada evento do site.
const metaPixelEvents: Partial<Record<AnalyticsEventName, string>> = {
  view_product: "ViewContent",
  add_to_cart: "AddToCart",
  begin_whatsapp_order: "Contact",
  whatsapp_click: "Contact",
  group_join_click: "Lead",
};

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackEvent(
  name: AnalyticsEventName,
  payload: Record<string, unknown> = {},
): void {
  if (typeof window === "undefined") return;

  try {
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({ event: name, ...payload });
  } catch {
    // Nunca deixar o rastreamento quebrar a experiência do usuário.
  }

  try {
    const metaEvent = metaPixelEvents[name];
    if (metaEvent) window.fbq?.("track", metaEvent, payload);
  } catch {
    // Idem.
  }
}
