import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/config/site";

/**
 * Logotipo oficial do Criatório Velho Oeste (public/logo.png, fundo
 * transparente) + nome do criatório escrito ao lado. Para trocar o
 * arquivo no futuro, basta substituir /public/logo.png (ou trocar o
 * src abaixo por outro arquivo).
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`group flex items-center gap-2.5 ${className ?? ""}`}
      aria-label={siteConfig.name}
    >
      <Image
        src="/logo.png"
        alt={siteConfig.name}
        width={193}
        height={100}
        priority
        className="h-12 w-auto sm:h-14"
      />
      <span className="flex flex-col leading-none">
        <span className="font-serif text-lg font-semibold tracking-wide text-brand-green">
          Velho Oeste
        </span>
        <span className="text-[0.65rem] uppercase tracking-[0.2em] text-brand-brown">
          Criatório
        </span>
      </span>
    </Link>
  );
}
