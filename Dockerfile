# syntax=docker/dockerfile:1

# Dockerfile de produção para o Criatório Velho Oeste (Next.js 16 standalone).
# Feito para builds automáticos no Coolify: build multi-stage, imagem final
# mínima (sem node_modules), rodando como usuário sem privilégios.

FROM node:20-alpine AS base

# ---------------------------------------------------------------------------
# 1) Dependências
# ---------------------------------------------------------------------------
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------------
# 2) Build
# ---------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variáveis NEXT_PUBLIC_* precisam existir NO MOMENTO DO BUILD, pois o
# Next.js as embute diretamente no código enviado ao navegador. No Coolify,
# configure-as em Environment Variables marcando a opção "Available at
# Buildtime" (ou equivalente) para que virem --build-arg automaticamente.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

ENV NEXT_TELEMETRY_DISABLED=1

# Limita o heap do Node durante o build. Sem isso, em VPS com pouca memória
# (comum em instalações Coolify), o processo de build pode ser morto pelo
# sistema operacional por falta de RAM — o erro aparece como algo genérico
# tipo "Failed to collect page data", sem explicação clara. Ajuste o valor
# (em MB) conforme a RAM disponível no seu servidor: 1536 é seguro para
# servidores com 2GB+; baixe para 768 se tiver menos memória.
ENV NODE_OPTIONS="--max-old-space-size=1536"

RUN npm run build

# ---------------------------------------------------------------------------
# 3) Runtime (imagem final, enxuta)
# ---------------------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Saída "standalone": server.js próprio + apenas os node_modules realmente
# usados (requer output: "standalone" no next.config.ts).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
