# ---- base ----
FROM node:20-bookworm AS base
WORKDIR /usr/src/api/strapi
ENV NODE_ENV=production
EXPOSE 1337

# ---- deps ----
FROM base AS deps
WORKDIR /usr/src/api/strapi
COPY package*.json ./
# Устанавливаем зависимости (включая pg)
RUN npm ci --only=production && npm cache clean --force

# ---- build (сборка админки) ----
FROM base AS build
WORKDIR /usr/src/api/strapi
COPY --from=deps /usr/src/api/strapi/node_modules ./node_modules
COPY . .
# Собираем админку Strapi (обязательно для production)
RUN npm run build

# ---- runner ----
FROM node:20-bookworm-slim AS runner
WORKDIR /usr/src/api/strapi
ENV NODE_ENV=production

# Устанавливаем необходимые системные пакеты
RUN apt-get update && apt-get install -y \
    dumb-init \
    libvips42 \
    && rm -rf /var/lib/apt/lists/*

# создаём непривилегированного пользователя
RUN groupadd -r strapi && useradd -r -g strapi strapi

# копируем билд и исходники
COPY --from=build /usr/src/api/strapi ./

# создаём папки для данных и загрузок с правильными правами
RUN mkdir -p \
    /usr/src/api/strapi/public/uploads \
    /usr/src/api/strapi/data/uploads \
    /usr/src/api/strapi/.tmp \
    && chown -R strapi:strapi /usr/src/api/strapi

# оставляем только прод-зависимости
RUN npm ci --omit=dev --ignore-scripts --prefer-offline \
  && npm cache clean --force \
  && chown -R strapi:strapi /usr/src/api/strapi

# Переключаемся на непривилегированного пользователя
USER strapi

# Используем dumb-init для правильной обработки сигналов
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]