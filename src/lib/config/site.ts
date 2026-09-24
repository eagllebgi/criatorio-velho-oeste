/**
 * Configuração central do Criatório Velho Oeste.
 * Altere os valores abaixo para atualizar nome, contatos, redes sociais e
 * textos institucionais em todo o site sem precisar procurar em vários arquivos.
 */

export const siteConfig = {
  name: "Criatório Velho Oeste",
  shortName: "Velho Oeste",
  description:
    "Ovos férteis de aves selecionadas, direto do Criatório Velho Oeste.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://criatoriovelhooeste.com.br",

  whatsapp: {
    // Número normalizado (com DDI), usado para montar o link wa.me
    number: "5518991309522",
    // Formato de exibição
    display: "(18) 99130-9522",
  },

  social: {
    instagram: "https://www.instagram.com/criatoriovelho_oeste/",
    facebook:
      "https://www.facebook.com/p/Criat%C3%B3rio-Velho-Oeste-Birigui-61578001743151/",
  },

  location: {
    city: "Birigui",
    state: "São Paulo",
  },

  legal: {
    privacyPolicyUrl: "/politica-de-privacidade",
    termsUrl: "/termos-de-uso",
  },

  // Limite padrão de estoque para exibir "Últimas unidades" quando o produto
  // não define um limite próprio (low_stock_threshold).
  defaultLowStockThreshold: 5,

  // shortLabel: versão mais curta usada só no menu do cabeçalho (desktop),
  // onde o espaço é apertado (logo + 7 itens + botão + carrinho, tudo numa
  // linha só). O menu mobile e o rodapé continuam usando o "label" completo,
  // onde sobra espaço de sobra.
  nav: [
    { label: "Início", href: "/" },
    { label: "Ovos Férteis", shortLabel: "Ovos", href: "/ovos" },
    { label: "Aves Vivas", shortLabel: "Aves", href: "/aves" },
    { label: "Sobre o Criatório", shortLabel: "Sobre", href: "/#sobre" },
    { label: "Como Funciona", href: "/#como-funciona" },
    { label: "Dúvidas", href: "/#duvidas" },
    { label: "Contato", href: "/#contato" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
