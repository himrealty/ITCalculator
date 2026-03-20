FROM node:20-alpine AS builder

RUN npm install -g pnpm@10

WORKDIR /app

# Workspace config (layer cache)
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml      ./
COPY package.json        ./
COPY tsconfig.base.json  ./

# Package manifests before install
COPY artifacts/api-server/package.json ./artifacts/api-server/

# Install + approve native builds (esbuild etc)
RUN pnpm install --frozen-lockfile --ignore-scripts && \
    pnpm approve-builds --yes || true

# Source
COPY artifacts/api-server/ ./artifacts/api-server/

# Build
RUN pnpm --filter @workspace/api-server run build

# ── RUNNER ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Compiled server bundle
COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist

# Install prod runtime deps (express, cors, cookie-parser)
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY pnpm-workspace.yaml ./
COPY package.json        ./
RUN npm install -g pnpm@10 && \
    pnpm --filter @workspace/api-server install --prod --ignore-scripts || true
    
# Static site - copy from the correct source to where server expects them
COPY artifacts/api-server/public/ ./public/
# Start script (autopinger every 14 min)
COPY scripts/start.sh ./scripts/start.sh
RUN chmod +x ./scripts/start.sh

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["sh", "scripts/start.sh"]
