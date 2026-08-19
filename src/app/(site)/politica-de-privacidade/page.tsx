import type { Metadata } from "next";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: `Como o ${siteConfig.name} coleta, usa e protege os dados dos visitantes do site.`,
};

export default function PoliticaDePrivacidadePage() {
  const localizacao = [siteConfig.location.city, siteConfig.location.state]
    .filter(Boolean)
    .join(" - ");

  return (
    <div className="container-site py-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-serif text-3xl font-semibold text-brand-ink sm:text-4xl">
          Política de Privacidade
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
              1. Quem somos
            </h2>
            <p className="mt-2">
              Esta Política de Privacidade se aplica ao site do{" "}
              {siteConfig.name}{localizacao ? `, com sede em ${localizacao}` : ""},
              e explica quais dados coletamos de quem visita o site, para que
              usamos essas informações e quais direitos você tem sobre elas,
              em conformidade com a Lei Geral de Proteção de Dados (Lei nº
              13.709/2018 — LGPD).
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-brand-ink">
              2. O site não processa pagamentos
            </h2>
            <p className="mt-2">
              O {siteConfig.name} funciona como catálogo. Você monta seu
              pedido diretamente no site (raças, quantidades e CEP) e ele é
              enviado por WhatsApp para o criatório finalizar a negociação.
              Não há checkout, cadastro de conta de cliente, coleta de dados
              de cartão ou qualquer forma de pagamento dentro do site.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-brand-ink">
              3. Quais dados coletamos
            </h2>
            <p className="mt-2">Coletamos os seguintes dados:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                <strong>CEP informado por você</strong> ao montar o pedido —
                usado apenas para compor a mensagem enviada ao WhatsApp do
                criatório, não é armazenado em nosso banco de dados.
              </li>
              <li>
                <strong>Itens do carrinho</strong> (raças e quantidades
                escolhidas) — ficam salvos apenas no seu próprio navegador
                (armazenamento local), não em nossos servidores, e são
                apagados quando você limpa os dados do navegador.
              </li>
              <li>
                <strong>Dados de navegação e uso</strong> (páginas visitadas,
                produtos visualizados, cliques em "Continuar pelo WhatsApp")
                — coletados de forma agregada para entender o desempenho do
                site, quando ferramentas de análise como Google Analytics ou
                Meta Pixel estiverem instaladas.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-brand-ink">
              4. Como usamos esses dados
            </h2>
            <p className="mt-2">Usamos os dados coletados para:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>Montar a mensagem de pedido que você envia pelo WhatsApp;</li>
              <li>
                Entender quais raças e páginas têm mais interesse, para
                melhorar o catálogo e o site;
              </li>
              <li>Garantir a segurança e o bom funcionamento do site.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-brand-ink">
              5. Compartilhamento com terceiros
            </h2>
            <p className="mt-2">
              Ao clicar em "Continuar pelo WhatsApp", você é direcionado para
              o WhatsApp (Meta), que passa a tratar a conversa conforme sua
              própria política de privacidade. Também podemos usar serviços
              de infraestrutura (como Supabase, para hospedar o banco de
              dados e as imagens do catálogo) e, futuramente, ferramentas de
              análise de audiência (Google Analytics, Meta Pixel). Não
              vendemos nem compartilhamos seus dados com terceiros para fins
              de marketing de outras empresas.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-brand-ink">
              6. Cookies e armazenamento local
            </h2>
            <p className="mt-2">
              O site usa o armazenamento local do seu navegador (
              <code>localStorage</code>) para guardar os itens do seu
              carrinho entre uma visita e outra. Se ferramentas de análise
              forem instaladas futuramente, cookies próprios delas também
              poderão ser usados — você pode bloqueá-los nas configurações
              do seu navegador a qualquer momento.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-brand-ink">
              7. Seus direitos
            </h2>
            <p className="mt-2">
              Conforme a LGPD, você pode solicitar a qualquer momento:
              confirmação de que tratamos seus dados, acesso a eles,
              correção de dados incompletos ou desatualizados, e eliminação
              dos dados tratados com seu consentimento. Para exercer esses
              direitos, entre em contato pelo WhatsApp{" "}
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

          <section>
            <h2 className="font-serif text-xl font-semibold text-brand-ink">
              8. Alterações desta política
            </h2>
            <p className="mt-2">
              Esta política pode ser atualizada de tempos em tempos, para
              refletir mudanças no site ou na legislação. A data da última
              atualização sempre estará indicada no topo desta página.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
