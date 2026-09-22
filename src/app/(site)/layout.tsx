import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import Link from "next/link";
import "../globals.css";
import { siteConfig } from "@/lib/config/site";
import { CartProvider } from "@/lib/cart/cart-context";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { getAdminUser } from "@/lib/supabase/server";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | Aves Ornamentais e Ovos Férteis`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: `${siteConfig.name} | Aves Ornamentais e Ovos Férteis`,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: "pt_BR",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const adminUser = await getAdminUser();
  const isAdmin = Boolean(adminUser);

  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-brand-cream text-brand-ink">
        <CartProvider>
          {isAdmin && (
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-brand-gold px-4 py-2 text-center text-xs font-medium text-brand-ink sm:text-sm">
              <span>
                Modo administrador: só você vê o estoque exato e pode editar
                direto na página.
              </span>
              <Link href="/admin" className="underline underline-offset-2 hover:no-underline">
                Ir para o painel
              </Link>
            </div>
          )}
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
