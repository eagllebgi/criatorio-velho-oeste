import { ListChecks, Hash, MapPinned, MessageCircle } from "lucide-react";

const steps = [
  {
    icon: ListChecks,
    title: "1. Escolha as raças",
    description: "Veja os ovos disponíveis atualmente.",
  },
  {
    icon: Hash,
    title: "2. Escolha a quantidade",
    description: "Informe quantos ovos deseja de cada raça.",
  },
  {
    icon: MapPinned,
    title: "3. Informe seu CEP",
    description: "O CEP será enviado junto com a solicitação.",
  },
  {
    icon: MessageCircle,
    title: "4. Finalize pelo WhatsApp",
    description: "Nossa equipe confirma disponibilidade, envio e demais informações.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="container-site py-20">
      <div className="mb-12 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
          Passo a passo
        </span>
        <h2 className="mt-2 font-serif text-3xl font-semibold text-brand-ink sm:text-4xl">
          Como funciona
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <div
            key={step.title}
            className="flex flex-col items-start gap-3 rounded-2xl border border-brand-sand/70 bg-white p-6"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
              <step.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="font-serif text-lg font-semibold text-brand-ink">
              {step.title}
            </h3>
            <p className="text-sm text-brand-ink/60">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
