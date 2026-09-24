import Link from "next/link";
import { siteConfig } from "@/lib/config/site";
import { Logo } from "@/components/layout/Logo";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { CartButton } from "@/components/cart/CartButton";
import { Button } from "@/components/ui/Button";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-sand/70 bg-brand-cream/95 backdrop-blur supports-[backdrop-filter]:bg-brand-cream/80">
      <div className="container-site flex h-20 items-center justify-between py-3">
        <Logo />

        {/* Só aparece a partir de xl (1280px) — com 7 itens de menu, o logo
            oficial (mais largo que um logo comum) e o botão "Ver ovos
            disponíveis" juntos, é muita coisa pra uma linha só. Abaixo disso
            cai pro menu hambúrguer (ver MobileMenu, mesmo breakpoint).
            Duas folgas extras pra não voltar a sobrepor: "Início" não entra
            aqui (o logo já leva pra home, fica redundante) e os itens mais
            longos usam a versão curta (shortLabel) — o menu mobile e o
            rodapé continuam com o nome completo, lá sobra espaço. */}
        <nav className="hidden items-center gap-5 xl:flex" aria-label="Principal">
          {siteConfig.nav
            .filter((item) => item.href !== "/")
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap text-sm font-medium text-brand-ink/80 transition-colors hover:text-brand-green"
              >
                {"shortLabel" in item ? item.shortLabel : item.label}
              </Link>
            ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button href="/ovos" size="sm" className="hidden sm:inline-flex">
            Ver ovos disponíveis
          </Button>
          <CartButton />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
