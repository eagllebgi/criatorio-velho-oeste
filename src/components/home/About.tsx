import Image from "next/image";
import { siteConfig } from "@/lib/config/site";

export function About() {
  return (
    <section id="sobre" className="bg-brand-cream-dark/60 py-20">
      <div className="container-site grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="relative order-2 aspect-[4/3] w-full overflow-hidden rounded-3xl lg:order-1">
          <Image
            src="/about.jpg"
            alt={siteConfig.name}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>

        <div className="order-1 lg:order-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
            Sobre o Criatório
          </span>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-brand-ink sm:text-4xl">
            Cuidado e dedicação em cada etapa da criação
          </h2>
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-brand-ink/70 sm:text-base">
            <p>
              O Criatório Velho Oeste é especializado em aves ornamentais
              selecionadas, oferecendo ovos férteis, filhotes e aves adultas
              com qualidade, cuidado e manejo responsável.
            </p>
            <p>
              Atendemos criadores e apaixonados por aves que buscam beleza,
              genética e confiança.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
