FROM node:20-alpine AS builder

RUN npm install -g pnpm@10

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml      ./
COPY package.json        ./
COPY tsconfig.base.json  ./

COPY artifacts/api-server/package.json ./artifacts/api-server/

RUN pnpm install --frozen-lockfile --ignore-scripts && \
    pnpm approve-builds --yes || true

COPY artifacts/api-server/ ./artifacts/api-server/

RUN pnpm --filter @workspace/api-server run build

# ── RUNNER ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist

# Install only prod runtime deps
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY pnpm-workspace.yaml ./
COPY package.json        ./
RUN npm install -g pnpm@10 && \
    cd artifacts/api-server && \
    pnpm install --prod --ignore-scripts || true

# Static site
COPY public/ ./public/

COPY scripts/start.sh ./scripts/start.sh
RUN chmod +x ./scripts/start.sh

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["sh", "scripts/start.sh"]
