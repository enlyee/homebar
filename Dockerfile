# Базовый образ Node.js
FROM node:20-alpine AS base

# Установка зависимостей только если нужно
FROM base AS deps
# Устанавливаем зависимости для sharp (обработка изображений)
RUN apk add --no-cache libc6-compat vips-dev python3 make g++ pkgconfig
WORKDIR /app

# Копирование файлов зависимостей
COPY package.json package-lock.json* ./
# Устанавливаем зависимости
RUN npm install

# Сборка приложения
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Сборка Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Продакшн образ
FROM base AS runner
WORKDIR /app

# Устанавливаем зависимости для sharp в продакшн образе
RUN apk add --no-cache vips

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Создаем директорию для загрузок ДО копирования файлов
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

# Копирование необходимых файлов из standalone сборки
# Важно: public должен быть скопирован ПЕРЕД standalone, чтобы Next.js мог обслуживать статические файлы
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Убеждаемся, что директория uploads существует и доступна
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

# Копирование TypeORM entities и других необходимых файлов
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/typeorm ./node_modules/typeorm
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/reflect-metadata ./node_modules/reflect-metadata
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/sharp ./node_modules/sharp

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Копирование файла инициализации и библиотек
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib

CMD ["node", "server.js"]
