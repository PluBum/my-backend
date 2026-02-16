# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем файлы зависимостей
COPY package.json yarn.lock ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN yarn install --frozen-lockfile

# Копируем исходный код
COPY . .

# Генерируем Prisma Client и собираем проект
RUN npx prisma generate
RUN yarn build:docker

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Копируем только необходимое
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/tsoa ./tsoa
COPY --from=builder /app/src/admin/admin.mjs ./build/src/admin/admin.mjs

# Переменные окружения
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Запуск приложения
CMD ["node", "./build/src/index.js"]
