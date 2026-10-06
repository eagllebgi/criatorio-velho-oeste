"use client";

import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/analytics/events";
import { siteConfig } from "@/lib/config/site";

/**
 * Botão que leva ao grupo de ofertas no WhatsApp. Registra o clique como
 * "group_join_click" (e, se o Meta Pixel estiver instalado, como "Lead"),
 * para medir quantas pessoas dos anúncios entraram no grupo.
 */
export function GroupJoinButton({
  children,
  position,
  variant = "secondary",
  className,
}: {
  children: React.ReactNode;
  position: string;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  function handleClick() {
    trackEvent("group_join_click", { position });
    try {
      const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
      fbq?.("track", "Lead", { content_name: "grupo_ofertas_whatsapp" });
    } catch {
      // Rastreamento nunca deve impedir a pessoa de entrar no grupo.
    }
  }

  return (
    <Button
      href={siteConfig.whatsapp.groupInviteUrl}
      target="_blank"
      rel="noopener noreferrer"
      size="lg"
      variant={variant}
      onClick={handleClick}
      className={className}
    >
      {children}
    </Button>
  );
}
