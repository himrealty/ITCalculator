#!/bin/sh

PORT="${PORT:-3000}"
PING_URL="${RENDER_EXTERNAL_URL:-http://localhost:${PORT}}/api/healthz"

echo "[autopinger] Will ping ${PING_URL} every 14 minutes"

(
  while true; do
    sleep 840
    wget -qO- "${PING_URL}" >/dev/null 2>&1 || true
    echo "[autopinger] pinged at $(date)"
  done
) &

echo "[server] Starting on port ${PORT}..."
exec node artifacts/api-server/dist/index.cjs