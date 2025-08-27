FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y \
    python3 \
    pkg-config \
    build-essential \
    git \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/app

COPY package.json package-lock.json ./
RUN npm install --force

COPY . .

RUN npm run build

FROM node:20-slim

WORKDIR /opt/app

RUN apt-get update && apt-get install -y \
    libvips42 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /opt/app ./

RUN chown -R node:node /opt/app

USER node

EXPOSE 1337

CMD ["npm", "run", "develop"]