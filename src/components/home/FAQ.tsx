"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/config/site";

const faqs = [
  {
    question: "O que são ovos férteis?",
    answer:
      "São ovos gerados por aves reprodutoras, aptos para incubação e nascimento de filhotes, ao contrário dos ovos comuns de consumo.",
  },
  {
    question: "Como faço meu pedido?",
    answer:
      'Acesse a página "Ovos Férteis", escolha as raças e quantidades desejadas, informe seu CEP e clique em "Continuar pelo WhatsApp". Nossa equipe dará continuidade ao atendimento por lá.',
  },
  {
    question: "Vocês enviam para minha cidade?",
    answer:
      "O envio é confirmado diretamente com o atendimento, de acordo com a sua localização. Consulte nossa equipe pelo WhatsApp para confirmar.",
  },
  {
    question: "Como consulto os ovos disponíveis?",
    answer:
      'Na página "Ovos Férteis" você encontra a disponibilidade atual de cada raça, atualizada pelo Criatório.',
  },
  {
    question: "Como é confirmado o valor do envio?",
    answer:
      "O valor do envio não é calculado automaticamente pelo site. Ele é confirmado pelo atendimento após o recebimento do seu pedido pelo WhatsApp, com base no CEP informado.",
  },
  {
    question: "O pedido é pago pelo site?",
    answer:
      "Não. O site não realiza cobranças. Ele apenas organiza o seu pedido e o envia para o WhatsApp do Criatório, onde o pagamento e demais detalhes são combinados diretamente com a equipe.",
  },
  {
    question: "Como entro em contato?",
    answer: `Você pode falar com a gente pelo WhatsApp ${siteConfig.whatsapp.display} a qualquer momento.`,
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="duvidas" className="bg-brand-cream-dark/60 py-20">
      <div className="container-site max-w-3xl">
        <div className="mb-10 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
            FAQ
          </span>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-brand-ink sm:text-4xl">
            Dúvidas frequentes
          </h2>
        </div>

        <div className="divide-y divide-brand-sand rounded-2xl border border-brand-sand/70 bg-white">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={faq.question}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-medium text-brand-ink sm:text-base">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-brand-brown transition-transform",
                      isOpen && "rotate-180",
                    )}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-sm leading-relaxed text-brand-ink/65">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
