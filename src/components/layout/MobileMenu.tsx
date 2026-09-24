"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { Button } from "@/components/ui/Button";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // O cabeçalho usa "backdrop-blur", e isso faz qualquer elemento
  // "position: fixed" dentro dele ficar preso à altura do próprio
  // cabeçalho (em vez de cobrir a tela toda) — é um comportamento padrão
  // do CSS. Por isso o menu (fundo + itens) só aparecia numa faixinha no
  // topo, sem contraste com o resto da página. Renderizando o menu num
  // portal direto no <body>, ele escapa dessa limitação e cobre a tela
  // inteira corretamente.
  useEffect(() => {
    // Flag "já montou no cliente" pra poder usar createPortal com segurança
    // (evita divergência de hidratação entre servidor e navegador).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const drawer = (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Fechar menu"
        className="absolute inset-0 bg-brand-ink/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="relative ml-auto flex h-full w-[85%] max-w-sm flex-col bg-brand-cream px-6 py-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <span className="font-serif text-lg font-semibold text-brand-green">
            Menu
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-brand-green hover:bg-brand-green/10"
            aria-label="Fechar menu"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base font-medium text-brand-ink hover:bg-brand-green/10"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-8">
          <Button href="/ovos" size="lg" className="w-full" onClick={() => setOpen(false)}>
            Ver ovos disponíveis
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    // Mesmo breakpoint do <nav> desktop em Header.tsx (xl) — os dois têm que
    // trocar exatamente juntos, senão fica uma faixa de largura sem nenhum
    // dos dois (ou com os dois ao mesmo tempo).
    <div className="xl:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-brand-green hover:bg-brand-green/10"
        aria-label="Abrir menu"
        aria-expanded={open}
      >
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {mounted && open && createPortal(drawer, document.body)}
    </div>
  );
}
