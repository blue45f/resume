# ── Build stage ──
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.14.4 --activate

# Root workspace + npmrc
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# All workspace packages (shared is tiny, client has deps but not built here)
COPY packages/shared ./packages/shared/
COPY packages/client/package.json ./packages/client/
COPY packages/server/package.json ./packages/server/

RUN pnpm install --frozen-lockfile

# Server source
COPY packages/server ./packages/server/

RUN pnpm --filter @resume/server exec prisma generate
RUN pnpm --filter @resume/server exec nest build

# ── Production stage ──
FROM node:20-alpine
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/server/node_modules ./packages/server/node_modules
COPY --from=builder /app/packages/server/dist ./packages/server/dist
COPY --from=builder /app/packages/server/prisma ./packages/server/prisma
COPY --from=builder /app/packages/server/prisma.config.ts ./packages/server/
COPY --from=builder /app/packages/server/package.json ./packages/server/
COPY --from=builder /app/package.json ./

USER nestjs
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "packages/server/dist/main.js"]
