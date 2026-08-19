import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/lib/config/site";

/**
 * Plano de fundo do Hero: foto real do criatório (public/hero.jpg) com um
 * degradê por cima para manter o texto legível. Para trocar a foto, basta
 * substituir /public/hero.jpg por outro arquivo com o mesmo nome.
 */
export function Hero() {
  return (
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
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(182,144,63,0.25), transparent 45%), radial-gradient(circle at 85% 80%, rgba(182,144,63,0.15), transparent 50%)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-brand-green-dark via-brand-green/90 to-brand-green/60"
        aria-hidden="true"
      />

      <div className="container-site relative flex min-h-[32rem] flex-col justify-center gap-6 py-24 sm:min-h-[36rem]">
        <span className="w-fit rounded-full border border-brand-gold-light/40 bg-brand-cream/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-brand-gold-light">
          {siteConfig.name}
        </span>
        <h1 className="max-w-2xl font-serif text-4xl font-semibold leading-tight text-brand-cream sm:text-5xl lg:text-6xl">
          Ovos férteis de aves selecionadas, direto do Criatório Velho Oeste
        </h1>
        <p className="max-w-xl text-base text-brand-cream/80 sm:text-lg">
          Escolha as raças disponíveis, monte seu pedido e finalize
          diretamente pelo WhatsApp com nossa equipe.
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Button href="/ovos" size="lg">
            Ver ovos disponíveis
          </Button>
          <Button
            href={`https://wa.me/${siteConfig.whatsapp.number}`}
            variant="outline"
            size="lg"
            className="border-brand-cream/50 text-brand-cream hover:bg-brand-cream hover:text-brand-green"
          >
            Falar com o Criatório
          </Button>
        </div>
      </div>
    </section>
  );
}
