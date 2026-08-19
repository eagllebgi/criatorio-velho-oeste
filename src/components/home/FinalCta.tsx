import { Button } from "@/components/ui/Button";

export function FinalCta() {
  return (
    <section id="contato" className="container-site py-20">
      <div className="flex flex-col items-center gap-6 rounded-3xl bg-brand-brown px-6 py-16 text-center text-brand-cream sm:px-16">
        <h2 className="max-w-2xl font-serif text-3xl font-semibold sm:text-4xl">
          Encontre as raças disponíveis no Criatório Velho Oeste
        </h2>
        <p className="max-w-lg text-sm text-brand-cream/80 sm:text-base">
          Monte seu pedido em poucos passos e finalize diretamente pelo
          WhatsApp com nossa equipe.
        </p>
        <Button href="/ovos" size="lg" variant="secondary">
          Ver ovos férteis disponíveis
        </Button>
      </div>
    </section>
  );
}
