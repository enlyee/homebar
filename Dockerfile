FROM node:20-slim AS base

FROM base AS deps
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    pkg-config \
    libvips-dev \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

FROM base AS builder
WORKDIR /app

ARG DATABASE_URL=""
ARG TELEGRAM_BOT_TOKEN=""
ARG TELEGRAM_CHAT_ID=""

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PHASE=phase-production-build
ENV NODE_ENV=production

ENV DATABASE_URL=${DATABASE_URL}
ENV TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
ENV TELEGRAM_CHAT_ID=${TELEGRAM_CHAT_ID}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM base AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y \
    libvips \
    gosu \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads && chmod -R 755 /app/public/uploads

COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/typeorm ./node_modules/typeorm
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/reflect-metadata ./node_modules/reflect-metadata
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/sharp ./node_modules/sharp

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]
