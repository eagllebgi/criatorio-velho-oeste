import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "../../globals.css";

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
  title: {
    default: "Painel Administrativo | Criatório Velho Oeste",
    template: "%s | Painel — Criatório Velho Oeste",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-brand-cream-dark/40 text-brand-ink">
        {children}
      </body>
    </html>
  );
}
