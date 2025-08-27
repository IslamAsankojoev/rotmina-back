# ---- base ----
FROM node:20-bookworm AS base
WORKDIR /opt/app
ENV NODE_ENV=production
EXPOSE 1337

# ---- deps ----
FROM base AS deps
WORKDIR /opt/app
COPY package*.json ./
# Устанавливаем зависимости (включая pg)
RUN npm ci

# ---- build (сборка админки) ----
FROM base AS build
WORKDIR /opt/app
COPY --from=deps /opt/app/node_modules ./node_modules
COPY . .
# Собираем админку Strapi (обязательно для production)
RUN npm run build

# ---- runner ----
FROM node:20-bookworm-slim AS runner
WORKDIR /opt/app
ENV NODE_ENV=production

# создаём непривилегированного пользователя
RUN groupadd -r strapi && useradd -r -g strapi strapi

# копируем билд и исходники
COPY --from=build /opt/app ./

# оставляем только прод-зависимости
RUN npm ci --omit=dev --ignore-scripts --prefer-offline \
  && npm cache clean --force

USER strapi
CMD ["npm","start"]