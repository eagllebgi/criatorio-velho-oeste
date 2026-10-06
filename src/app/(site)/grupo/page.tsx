import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BellRing, Camera, Sparkles, MessageCircleOff } from "lucide-react";
import { GroupJoinButton } from "@/components/grupo/GroupJoinButton";
import { siteConfig } from "@/lib/config/site";

/**
 * /grupo — página de destino dos anúncios da Meta.
 * A Meta não aceita o link de convite do WhatsApp direto no anúncio, então o
 * anúncio aponta para cá e o botão leva ao grupo. O link do grupo fica em
 * siteConfig.whatsapp.groupInviteUrl (src/lib/config/site.ts).
 */

export const metadata: Metadata = {
  title: "Grupo de Novidades",
  description: `Entre no grupo do ${siteConfig.name} no WhatsApp e receba em primeira mão a disponibilidade de ovos férteis e aves ornamentais.`,
  openGraph: {
    title: `Grupo de Novidades | ${siteConfig.name}`,
    description:
      "Novidades, disponibilidade e bastidores direto do criatório, no seu WhatsApp.",
    url: `${siteConfig.url}/grupo`,
    siteName: siteConfig.name,
    locale: "pt_BR",
    type: "website",
  },
};

const beneficios = [
  {
    icon: BellRing,
    title: "Primeiro a saber",
    description:
      "Avisamos no grupo assim que novas posturas e raças ficam disponíveis.",
  },
  {
    icon: Sparkles,
    title: "Condições especiais",
    description: "Lotes e oportunidades exclusivas para quem está no grupo.",
  },
  {
    icon: Camera,
    title: "Direto do criatório",
    description: "Fotos das aves, bastidores do manejo e dicas de incubação.",
  },
  {
    icon: MessageCircleOff,
    title: "Sem bagunça",
    description:
      "Grupo só de avisos: você recebe as novidades sem excesso de mensagens.",
  },
];

const galeria = [
  { src: "/gallery/aves.jpg", alt: "Aves do criatório" },
  { src: "/gallery/marrecos.jpg", alt: "Marrecos" },
  { src: "/gallery/instalacoes.jpg", alt: "Instalações do criatório" },
];

export default function GrupoPage() {
  return (
    <>
      {/* Topo */}
      <section className="relative overflow-hidden bg-brand-green">
        <Image
          src="/hero.jpg"
          alt=""
          fill
          priority
          className="object-cover object-[50%_20%]"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-brand-green-dark via-brand-green/90 to-brand-green/60"
          aria-hidden="true"
        />

        <div className="container-site relative flex min-h-[30rem] flex-col items-center justify-center gap-6 py-20 text-center">
          <span className="w-fit rounded-full border border-brand-gold-light/40 bg-brand-cream/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-brand-gold-light">
            Grupo no WhatsApp
          </span>
          <h1 className="max-w-2xl font-serif text-4xl font-semibold leading-tight text-brand-cream sm:text-5xl">
            Acompanhe o {siteConfig.name} de perto
          </h1>
          <p className="max-w-xl text-base text-brand-cream/80 sm:text-lg">
            Entre no nosso grupo e receba no seu WhatsApp as novidades de ovos
            férteis e aves ornamentais antes de todo mundo.
          </p>
          <GroupJoinButton position="topo" className="w-full sm:w-auto">
            Entrar no grupo
          </GroupJoinButton>
          <p className="text-xs text-brand-cream/60">
            É grátis e você pode sair quando quiser.
          </p>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-20">
        <div className="container-site">
          <div className="mb-12 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
              Por que entrar
            </span>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-brand-ink sm:text-4xl">
              O que você recebe no grupo
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {beneficios.map((item) => (
              <div
                key={item.title}
                className="flex flex-col items-start gap-3 rounded-3xl bg-brand-cream-dark/60 p-6"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-green text-brand-gold-light">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="font-serif text-lg font-semibold text-brand-ink">
                  {item.title}
                </h3>
                <p className="text-sm text-brand-ink/70">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sobre + fotos */}
      <section className="bg-brand-cream-dark/60 py-20">
        <div className="container-site">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
              Quem somos
            </span>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-brand-ink sm:text-4xl">
              Criação com cuidado em {siteConfig.location.city}/SP
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-brand-ink/70 sm:text-base">
              Somos um criatório especializado em aves ornamentais selecionadas,
              com manejo responsável e foco em genética e qualidade. No grupo
              você acompanha de perto o nosso dia a dia.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {galeria.map((foto) => (
              <div
                key={foto.src}
                className="relative aspect-[4/3] overflow-hidden rounded-3xl"
              >
                <Image
                  src={foto.src}
                  alt={foto.alt}
                  fill
                  className="object-cover"
                  sizes="(min-width: 640px) 33vw, 100vw"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chamada final */}
      <section className="container-site py-20">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-brand-brown px-6 py-16 text-center text-brand-cream sm:px-16">
          <h2 className="max-w-2xl font-serif text-3xl font-semibold sm:text-4xl">
            Faça parte do grupo
          </h2>
          <p className="max-w-lg text-sm text-brand-cream/80 sm:text-base">
            Um toque e você já recebe as próximas novidades do criatório.
          </p>
          <GroupJoinButton position="final" className="w-full sm:w-auto">
            Quero entrar no grupo
          </GroupJoinButton>
          <div className="flex flex-col items-center gap-2 text-sm text-brand-cream/70">
            <a
              href={`https://wa.me/${siteConfig.whatsapp.number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-brand-cream"
            >
              Prefere falar direto com a gente? Chame no WhatsApp
            </a>
            <Link
              href="/ovos"
              className="underline underline-offset-2 hover:text-brand-cream"
            >
              Ver o catálogo de ovos férteis
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
