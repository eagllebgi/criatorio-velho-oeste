import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/config/site";

/**
 * Logotipo oficial do Criatório Velho Oeste: brasão (public/logo.png, fundo
 * transparente) + nome do criatório na fonte original da marca
 * (public/logo-texto.png, também com fundo transparente), lado a lado.
 * Antes o nome ao lado do brasão era só texto normal do site; agora usa a
 * arte oficial enviada pelo Gabriel. Para trocar qualquer um dos dois no
 * futuro, basta substituir o arquivo correspondente em /public.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`group flex items-center gap-2 ${className ?? ""}`}
      aria-label={siteConfig.name}
    >
      <Image
        src="/logo.png"
        alt=""
        width={193}
        height={100}
        priority
        className="h-9 w-auto sm:h-11 lg:h-14"
      />
      <Image
        src="/logo-texto.png"
        alt={siteConfig.name}
        width={2383}
        height={580}
        priority
        className="h-9 w-auto sm:h-11 lg:h-14"
      />
    </Link>
  );
}
