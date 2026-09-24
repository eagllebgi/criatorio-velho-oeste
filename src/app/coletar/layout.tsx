import type { Metadata } from "next";
import "../globals.css";
import { siteConfig } from "@/lib/config/site";

// Rota pública fora dos grupos (site) e (admin) — por isso precisa do seu
// próprio <html>/<body> aqui (cada um desses dois grupos já é uma raiz
// própria, sem layout.tsx compartilhado em src/app). Tela pensada pro
// camponês usar no celular/tablet no meio do galinheiro: sem cabeçalho,
// carrinho ou menu do site — só o essencial pra registrar a coleta rápido.
// Sem next/font aqui de propósito: essa tela não precisa da tipografia de
// marca (Inter/Fraunces) pra funcionar bem — usa a fonte padrão do sistema,
// que já carrega instantânea em qualquer celular no meio do galinheiro.
export const metadata: Metadata = {
  title: "Coleta de ovos",
  description: `Registro de coleta de ovos — ${siteConfig.name}.`,
  robots: { index: false, follow: false },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function ColetarLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-brand-cream text-brand-ink">{children}</body>
    </html>
  );
}
