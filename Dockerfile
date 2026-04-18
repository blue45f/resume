# ── Build stage ──
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.14.4 --activate

# Workspace root + packages
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages/
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN pnpm install --frozen-lockfile

COPY tsconfig.server.json nest-cli.json ./
COPY server ./server/

RUN pnpm exec prisma generate
RUN pnpm exec nest build

# ── Production stage ──
FROM node:20-alpine
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/package.json ./

USER nestjs
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "dist-server/main.js"]
