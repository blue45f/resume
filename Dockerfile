# syntax=docker/dockerfile:1
#
# Cloud Run production image for the NestJS API (service: resume-api).
#
# Used by `gcloud run deploy resume-api --source .` — when a Dockerfile is
# present, Cloud Build uses it instead of buildpacks. Designed for Cloud Run:
#   - listens on $PORT (Cloud Run injects PORT, default 8080)
#   - runs as a non-root user
#   - node 22 (matches engines.node >=22.12.0)
#   - multi-stage: build deps are dropped from the runtime image
#   - only the server is built (the client is deployed separately on Vercel)
#
# NOTE: `.dockerignore` must NOT exclude `src/` or `prisma/`, or the build below
# (nest build + prisma generate) will fail. See docs/DEPLOYMENT.md.

############################
# 1) Build stage
############################
FROM node:22-slim AS build

# Prisma 7 needs openssl at generate time.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=development

RUN npm install -g pnpm@11.4.0

# Install with a warm cache: copy manifests first.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

# Copy the rest and build only the server.
COPY . .
# Defensively drop any stale incremental TS caches / dist so `nest build` (tsc
# with incremental:true) always emits fresh .js — a stale .tsbuildinfo makes tsc
# emit only .d.ts, yielding a broken runtime image.
RUN rm -rf packages/server/dist packages/server/tsconfig.tsbuildinfo \
  packages/server/node_modules/.tmp 2>/dev/null || true
RUN pnpm prisma:generate \
  && pnpm build:server

############################
# 2) Runtime stage
############################
FROM node:22-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production
# Cloud Run injects PORT; default to 8080 for local `docker run` parity.
ENV PORT=8080

# Bring over manifests, installed deps (incl. generated Prisma client),
# the compiled server, and the Prisma schema (needed at runtime by the client).
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/server/dist ./packages/server/dist
COPY --from=build /app/packages/server/package.json ./packages/server/package.json
COPY --from=build /app/packages/server/prisma ./packages/server/prisma
# `@resume/shared` is a workspace dep that resolves to raw TS source
# (package.json main = ./src/index.ts), so its source must be present at
# runtime — the server's compiled output imports it via the node_modules symlink.
COPY --from=build /app/packages/shared ./packages/shared

# Run as the unprivileged `node` user that ships with the base image.
USER node

EXPOSE 8080

# Liveness probe — hits the cheap `/api/health/live` alias which never touches
# the DB (NOT readiness, which pings Postgres). The base image has no wget/curl,
# so probe with the bundled node binary over plain http. Exit non-zero on any
# error or non-2xx status so Docker/orchestrators mark the container unhealthy.
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=20s \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||8080)+'/api/health/live',r=>process.exit(r.statusCode>=200&&r.statusCode<300?0:1)).on('error',()=>process.exit(1))"

# main.ts reads PORT from the environment.
CMD ["node", "packages/server/dist/main.js"]
