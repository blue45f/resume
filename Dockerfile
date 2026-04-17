# ── Build stage ──
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@9.14.4 2>/dev/null || true

COPY package.json pnpm-lock.yaml* package-lock.json* ./
COPY prisma ./prisma/
RUN pnpm install --frozen-lockfile 2>/dev/null || npm install

COPY tsconfig.server.json nest-cli.json ./
COPY server ./server/
RUN npx prisma generate
RUN npm run build:server

# ── Production stage ──
FROM node:20-alpine
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/prisma ./prisma
COPY package.json ./

USER nestjs
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "dist-server/main.js"]
