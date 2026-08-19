import type { Metadata } from "next";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: `Condições de uso do site do ${siteConfig.name}.`,
};

export default function TermosDeUsoPage() {
  return (
    <div className="container-site py-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-serif text-3xl font-semibold text-brand-ink sm:text-4xl">
          Termos de Uso
        </h1>
        <p className="mt-3 text-sm text-brand-ink/60">
          Última atualização: {new Date().toLocaleDateString("pt-BR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-brand-ink/80 sm:text-base">
          <section>
            <h2 className="font-serif text-xl font-semibold text-brand-ink">
              1. Aceitação dos termos
            </h2>
            <p className="mt-2">
              Ao acessar e usar o site do {siteConfig.name}, você concorda
              com estes Termos de Uso. Se não concordar com algum ponto, pedimos
              que não utilize o site.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-brand-ink">
              2. Sobre o site
            </h2>
            <p className="mt-2">
              O site do {siteConfig.name} é um catálogo informativo de ovos
              férteis de aves selecionadas. Por meio dele você pode montar um
              pedido (raças, quantidades e CEP) que é enviado, ao final, para
              o WhatsApp do criatório. O site não realiza vendas, cobranças
              ou pagamentos diretamente — toda negociação, confirmação de
              disponibilidade, valores finais, formas de pagamento e envio
              são combinados diretamente com o criatório pelo WhatsApp.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-brand-ink">
              3. Disponibilidade, preços e estoque
            </h2>
            <p className="mt-2">
              Fazemos o possível para manter o catálogo atualizado, mas a
              disponibilidade de cada raça e o estoque exibido podem mudar
              sem aviso prévio, conforme a produção do criatório. Os preços
              exibidos no site são referenciais e devem ser confirmados no
              momento da conversa pelo WhatsApp, assim como prazos de entrega
              e condições de envio.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-brand-ink">
              4. Uso adequado do site
            </h2>
            <p className="mt-2">Ao usar o site, você concorda em não:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>Utilizá-lo para fins ilegais ou não autorizados;</li>
              <li>
                Tentar acessar áreas restritas (como o painel administrativo)
                sem autorização;
              </li>
              <li>
                Interferir no funcionamento do site ou tentar extrair dados
                de forma automatizada sem permissão.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-brand-ink">
              5. Propriedade intelectual
            </h2>
            <p className="mt-2">
              O nome, a logomarca, os textos, as fotos e demais conteúdos do
              site pertencem ao {siteConfig.name} e não podem ser copiados,
              reproduzidos ou usados sem autorização prévia.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-brand-ink">
              6. Limitação de responsabilidade
            </h2>
            <p className="mt-2">
              O site é fornecido "como está". Fazemos o possível para manter
              as informações corretas e o site disponível, mas não garantimos
              que ele estará livre de interrupções ou erros. Eventuais
              problemas técnicos podem ser reportados pelo WhatsApp.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-brand-ink">
              7. Alterações destes termos
            </h2>
            <p className="mt-2">
              Estes Termos de Uso podem ser atualizados periodicamente. A
              data da última atualização sempre estará indicada no topo desta
              página.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-brand-ink">
              8. Legislação aplicável
            </h2>
            <p className="mt-2">
              Estes termos são regidos pela legislação brasileira. Em caso de
              dúvidas, entre em contato pelo WhatsApp{" "}
              <a
                href={`https://wa.me/${siteConfig.whatsapp.number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-brand-ink"
              >
                {siteConfig.whatsapp.display}
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
