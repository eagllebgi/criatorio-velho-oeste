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
            disponíveis" juntos, "lg" (1024px) não é largura suficiente: o
            menu ficava sobrepondo o logo em notebooks comuns (1024–1279px).
            Nessa faixa, cai pro menu hambúrguer (ver MobileMenu, mesmo
            breakpoint). */}
        <nav className="hidden items-center gap-6 xl:flex" aria-label="Principal">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-brand-ink/80 transition-colors hover:text-brand-green"
            >
              {item.label}
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
