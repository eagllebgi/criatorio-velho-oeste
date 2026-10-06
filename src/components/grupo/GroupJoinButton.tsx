"use client";

import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/analytics/events";
import { siteConfig } from "@/lib/config/site";

/**
 * Botão que leva ao grupo de ofertas no WhatsApp. Registra o clique como
 * "group_join_click" (no Pixel da Meta, evento "Lead"),
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
    // Vira o evento "Lead" no Pixel da Meta (ver lib/analytics/events.ts).
    trackEvent("group_join_click", { position });
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
