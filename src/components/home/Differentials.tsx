import { Feather, Users, RefreshCcw, Smartphone } from "lucide-react";

const items = [
  {
    icon: Feather,
    title: "Variedade de aves ornamentais",
    description: "Diversas raças reunidas em um só catálogo.",
  },
  {
    icon: Users,
    title: "Atendimento direto com o criatório",
    description: "Fale diretamente com a equipe pelo WhatsApp.",
  },
  {
    icon: RefreshCcw,
    title: "Disponibilidade atualizada",
    description: "O estoque do catálogo reflete a produção atual.",
  },
  {
    icon: Smartphone,
    title: "Facilidade para solicitar seu pedido",
    description: "Monte o pedido em poucos passos, direto do celular.",
  },
];

export function Differentials() {
  return (
    <section className="bg-brand-green py-20 text-brand-cream">
      <div className="container-site">
        <div className="mb-12 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold-light">
            Diferenciais
          </span>
          <h2 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">
            Por que escolher o Criatório Velho Oeste
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.title} className="flex flex-col items-start gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-cream/10 text-brand-gold-light">
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="font-serif text-lg font-semibold">{item.title}</h3>
              <p className="text-sm text-brand-cream/70">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
