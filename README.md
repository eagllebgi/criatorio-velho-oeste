# Criatório Velho Oeste — Site

Site institucional + catálogo de ovos férteis do Criatório Velho Oeste. O
cliente monta o pedido no site (raças, quantidades e CEP) e é enviado para o
WhatsApp do criatório para finalizar — **não há pagamento nem checkout no
site**.

Stack: **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Supabase**
(Database, Auth e Storage). Pronto para deploy na **Vercel**.

Este guia foi escrito para quem **não é desenvolvedor**. Siga na ordem.

---

## 1. Instalar e rodar localmente

Pré-requisitos: [Node.js](https://nodejs.org) 20 ou mais recente instalado.

```bash
cd criatorio-velho-oeste
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Sem o Supabase
configurado (próximo passo), o site abre normalmente, mas o catálogo aparece
vazio e o painel `/admin` mostra um aviso pedindo a configuração.

---

## 2. Criar e configurar o projeto no Supabase

1. Crie uma conta gratuita em [supabase.com](https://supabase.com) e clique em
   **New Project**.
2. Anote a senha do banco que você definir (não é a mesma coisa usada no
   site, mas guarde por segurança).
3. Quando o projeto terminar de ser criado, vá em **Project Settings → API**.
   Você vai precisar de dois valores:
   - **Project URL** → algo como `https://xxxxxxxxxxxx.supabase.co`
   - **anon public key** → uma chave longa

### 2.1 Preencher o `.env.local`

Na pasta `criatorio-velho-oeste`, copie o arquivo de exemplo:

```bash
cp .env.example .env.local
```

Abra `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Reinicie o `npm run dev` depois de editar o `.env.local`.

---

## 3. Criar as tabelas (migrations)

O SQL já está pronto em `supabase/migrations/`. Existem duas formas de
aplicar:

### Opção A — pelo painel do Supabase (mais simples)

1. No painel do Supabase, abra **SQL Editor**.
2. Cole o conteúdo de `supabase/migrations/0001_init.sql`, clique em **Run**.
3. Repita para `supabase/migrations/0002_storage.sql`.
4. Por fim, cole o conteúdo de `supabase/seed.sql` e clique em **Run** — isso
   cadastra as categorias e as 24 raças iniciais (sem preço e sem estoque
   definidos, para você preencher depois).

### Opção B — pela CLI do Supabase

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

O que cada arquivo faz:

- `0001_init.sql` — cria as tabelas `categories`, `products`,
  `product_images`, os índices e as políticas de segurança (RLS).
- `0002_storage.sql` — cria o bucket público `product-images` no Storage
  (onde ficam as fotos das raças) e suas permissões.
- `seed.sql` — cadastra as categorias e as 24 raças iniciais informadas pelo
  Criatório.

---

## 4. Configurar o Storage (fotos)

O passo `0002_storage.sql` já cria o bucket `product-images` como público
para leitura. Não é necessário nenhum passo manual adicional — o upload de
fotos é feito direto pelo painel `/admin`, na tela de cada produto.

---

## 5. Criar o usuário administrador

O painel `/admin` **não tem cadastro público** — só quem já tem uma conta
consegue entrar. Para criar a conta do Criatório:

1. No painel do Supabase, vá em **Authentication → Users**.
2. Clique em **Add user → Create new user**.
3. Preencha e-mail e senha (essa é a senha que será usada para entrar em
   `/admin/login`).
4. Marque a opção para confirmar o e-mail automaticamente (ou confirme pelo
   e-mail recebido, se o envio de e-mail estiver configurado).

Pronto — esse e-mail e senha já dão acesso completo ao painel administrativo.
Para adicionar outra pessoa da equipe no futuro, repita o processo.

---

## 6. Cadastrar produtos (raças), preços e estoque

Depois do seed (passo 3), as 24 raças já estão cadastradas, mas **inativas**,
**sem preço** e **sem estoque** — elas só aparecem no site depois de você
configurá-las:

1. Acesse `/admin/login` e entre com o usuário criado no passo 5.
2. Vá em **Preços** e defina o preço por ovo de cada raça.
3. Vá em **Estoque** e defina a quantidade disponível de cada raça.
4. Vá em **Produtos**, abra cada raça e marque **Ativo** (e, se quiser,
   **Destaque na Home**) — só produtos ativos aparecem no site.
5. Ainda em **Produtos → editar**, envie as fotos de cada raça.

Para cadastrar uma raça nova que não estava na lista inicial, use
**Produtos → Adicionar nova raça**.

Categorias (usadas nos filtros do catálogo) ficam em **Categorias** —
você pode renomear, ativar/desativar ou criar novas a qualquer momento.

---

## 7. Qualidade de código (já verificado)

```bash
npm run lint       # ESLint
npx tsc --noEmit   # checagem de tipos
npm run build      # build de produção
```

Os três já foram executados neste projeto e passam sem erros.

---

## 8. Publicar na Vercel

1. Suba este projeto para um repositório no GitHub (ou GitLab/Bitbucket).
2. Em [vercel.com](https://vercel.com), clique em **Add New → Project** e
   importe o repositório.
3. Quando a Vercel perguntar as variáveis de ambiente, adicione as mesmas do
   seu `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` → coloque a URL final do site (ex:
     `https://criatoriovelhooeste.com.br`)
4. Clique em **Deploy**.

### Trocar de domínio depois

Na Vercel, vá em **Settings → Domains** do projeto e adicione o domínio
próprio (ex: `criatoriovelhooeste.com.br`), seguindo as instruções de DNS que
a Vercel mostra. Depois, atualize a variável `NEXT_PUBLIC_SITE_URL` para o
novo domínio e faça um novo deploy (ou redeploy).

---

## 9. Trocar logo e identidade visual

### Logo

O espaço do logotipo fica em
[`src/components/layout/Logo.tsx`](src/components/layout/Logo.tsx). Para
usar o arquivo definitivo:

1. Salve o arquivo em `public/logo.svg` (ou `.png`).
2. No arquivo `Logo.tsx`, troque o bloco de texto/ícone pelo componente
   `<Image src="/logo.svg" alt="Criatório Velho Oeste" width={160} height={48} priority />`
   (o componente `Image` já vem do `next/image`).

### Cores

Todas as cores do site ficam centralizadas em
[`src/app/globals.css`](src/app/globals.css), no topo do arquivo (bloco
`:root`). Basta trocar os valores hexadecimais — o site inteiro (botões,
textos, cards, header, footer) usa essas variáveis.

### Textos institucionais, WhatsApp e redes sociais

Ficam centralizados em
[`src/lib/config/site.ts`](src/lib/config/site.ts) — nome do criatório,
número de WhatsApp, Instagram, Facebook, endereço e textos legais.

### Fotos da Home (galeria, hero, seção "Sobre")

Como ainda não há fotos oficiais, essas seções usam blocos ilustrativos
(degradês) no lugar de fotos reais — cada componente em
`src/components/home/` tem um comentário explicando exatamente onde trocar
pelo `<Image>` com a foto real.

---

## 10. Estrutura do projeto (visão geral)

```
src/
  app/
    (site)/           páginas públicas: Home, /ovos, /ovos/[slug]
    (admin)/admin/    painel administrativo (login + área protegida)
    robots.ts         SEO
  components/
    layout/           Header, Footer, Logo, menu mobile
    home/             seções da Home
    catalog/          catálogo, filtros, card de produto
    cart/             carrinho/pedido, CEP, drawer
    admin/            tabelas e formulários do painel
    ui/               botão, badge (primitivos reutilizáveis)
  lib/
    config/site.ts    configuração central do site
    supabase/         clientes Supabase (browser, server)
    data/              consultas ao banco (público e admin)
    cart/             estado do carrinho (persistido no navegador)
    whatsapp.ts       montagem da mensagem do WhatsApp
    cep.ts            validação/consulta de CEP
    analytics/        eventos prontos para Google Analytics/Meta Pixel
supabase/
  migrations/         SQL das tabelas e políticas de segurança
  seed.sql            categorias + 24 raças iniciais
```

---

## 11. Como o pedido funciona (resumo técnico)

- O carrinho é salvo no navegador do cliente (`localStorage`) — não exige
  cadastro nem login do comprador.
- Adicionar itens ao pedido **não** reduz o estoque automaticamente — o
  estoque só muda quando o administrador atualiza pelo painel. Isso evita
  contar como venda um pedido que foi só enviado pelo WhatsApp.
- Ao clicar em **Continuar pelo WhatsApp**, o site monta a mensagem
  automaticamente com as raças, quantidades, valores e o CEP informado, e
  abre `https://wa.me/5518991309522` com tudo pré-preenchido.
- Eventos de analytics (`view_product`, `add_to_cart`, `remove_from_cart`,
  `begin_whatsapp_order`, `whatsapp_click`) já disparam internamente — basta
  instalar futuramente o Google Analytics/GTM/Meta Pixel para começar a
  recebê-los (ver `src/lib/analytics/events.ts`).

---

## Suporte

Qualquer dúvida técnica adicional, consulte a documentação oficial do
[Next.js](https://nextjs.org/docs) e do [Supabase](https://supabase.com/docs).
