import { Egg } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/lib/config/site";

export function EmptyState({
  title,
  description,
  showWhatsApp = false,
}: {
  title: string;
  description: string;
  showWhatsApp?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-brand-sand bg-white/60 px-6 py-16 text-center">
      <Egg className="h-10 w-10 text-brand-brown/40" aria-hidden="true" />
      <h3 className="font-serif text-xl font-semibold text-brand-ink">{title}</h3>
      <p className="max-w-md text-sm text-brand-ink/60">{description}</p>
      {showWhatsApp && (
        <Button
          href={`https://wa.me/${siteConfig.whatsapp.number}`}
        >
          Consultar disponibilidade pelo WhatsApp
        </Button>
      )}
    </div>
  );
}
