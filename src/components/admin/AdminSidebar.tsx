"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBasket,
  Wallet,
  Warehouse,
  Bird,
  Egg,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/(admin)/admin/login/actions";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/produtos", label: "Produtos", icon: ShoppingBasket, exact: false },
  { href: "/admin/financeiro", label: "Financeiro", icon: Wallet, exact: false },
  { href: "/admin/baias", label: "Baias", icon: Warehouse, exact: false },
  { href: "/admin/aves", label: "Plantel", icon: Bird, exact: false },
  { href: "/admin/postura", label: "Postura", icon: Egg, exact: false },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="no-print hidden w-64 shrink-0 flex-col border-r border-brand-sand/70 bg-white lg:flex">
        <div className="border-b border-brand-sand/70 px-6 py-5">
          <span className="font-serif text-lg font-semibold text-brand-green">
            Velho Oeste
          </span>
          <p className="text-xs text-brand-ink/50">Painel administrativo</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-green text-brand-cream"
                    : "text-brand-ink/70 hover:bg-brand-green/10",
                )}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-brand-sand/70 px-3 py-4">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-ink/70 hover:bg-brand-green/10"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Ver site
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-ink/70 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      <nav className="no-print flex gap-1 overflow-x-auto border-b border-brand-sand/70 bg-white px-3 py-2 lg:hidden">
        {navItems.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium",
                active
                  ? "bg-brand-green text-brand-cream"
                  : "bg-brand-cream-dark/60 text-brand-ink/70",
              )}
            >
              <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
        {/* No celular o menu do admin ficava só com os links internos — faltava
            um jeito rápido de voltar pro site (antes tinha que sair do painel
            e navegar de novo). Aqui replica o "Ver site" que já existia na
            versão de computador. */}
        <Link
          href="/"
          target="_blank"
          className="flex shrink-0 items-center gap-2 rounded-full bg-brand-cream-dark/60 px-3.5 py-1.5 text-xs font-medium text-brand-ink/70"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          Ver site
        </Link>
      </nav>
    </>
  );
}
