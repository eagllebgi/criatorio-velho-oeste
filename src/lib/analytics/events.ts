/**
 * Camada fina de rastreamento de eventos, pronta para futura integração com
 * Google Analytics / GTM / Meta Pixel. Enquanto nenhuma ferramenta estiver
 * instalada, os eventos apenas alimentam o dataLayer (se existir) — nunca
 * lançam erro e nunca bloqueiam a interação do usuário.
 */

export type AnalyticsEventName =
  | "view_product"
  | "add_to_cart"
  | "remove_from_cart"
  | "begin_whatsapp_order"
  | "whatsapp_click";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
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
}
