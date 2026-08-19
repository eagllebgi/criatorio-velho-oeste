import { cn } from "@/lib/utils";

type BadgeTone = "available" | "low" | "out" | "neutral" | "gold";

const toneClasses: Record<BadgeTone, string> = {
  available: "bg-brand-green/10 text-brand-green",
  low: "bg-brand-gold/15 text-brand-brown-dark",
  out: "bg-brand-ink/10 text-brand-ink/70",
  neutral: "bg-brand-sand text-brand-brown-dark",
  gold: "bg-brand-gold text-brand-ink",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
