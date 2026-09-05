FROM node:24-slim
RUN npm install -g pnpm@11
WORKDIR /app

COPY . .
RUN --mount=type=cache,target=/pnpm-store pnpm install --frozen-lockfile --store-dir /pnpm-store
RUN pnpm --filter worker build

WORKDIR /app/apps/worker
CMD ["pnpm", "start"]
