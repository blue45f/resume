# syntax=docker/dockerfile:1

FROM node:22-slim AS build

WORKDIR /app

RUN npm install -g pnpm@11.4.0

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM node:22-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/
COPY --from=build /app/packages /app/packages
COPY --from=build /app/node_modules /app/node_modules

CMD ["node", "packages/server/dist/main.js"]
