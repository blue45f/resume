# ── Build stage ──
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN npm install --legacy-peer-deps

COPY tsconfig.server.json nest-cli.json ./
COPY server ./server/
RUN npx prisma generate
RUN npx nest build

# ── Production stage ──
FROM node:20-alpine
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY package.json ./

USER nestjs
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "dist-server/main.js"]
