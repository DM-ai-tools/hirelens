#!/bin/sh
set -e

UPLOAD_DIR="${UPLOAD_DIR:-/app/uploads}"
REPORT_DIR="${REPORT_DIR:-/app/reports}"
mkdir -p "$UPLOAD_DIR" "$REPORT_DIR"

PRISMA_MIGRATE_CLI="./prisma-migrate/node_modules/prisma/build/index.js"
PRISMA_MIGRATE_NODE_PATH="$(pwd)/prisma-migrate/node_modules"

if [ -n "$DATABASE_URL" ]; then
  echo "[HireLens] Applying database migrations..."
  if [ -f "$PRISMA_MIGRATE_CLI" ]; then
    NODE_PATH="$PRISMA_MIGRATE_NODE_PATH${NODE_PATH:+:$NODE_PATH}" \
      node "$PRISMA_MIGRATE_CLI" migrate deploy
  else
    echo "[HireLens] ERROR: Prisma migrate CLI missing at $PRISMA_MIGRATE_CLI"
    exit 1
  fi
else
  echo "[HireLens] WARNING: DATABASE_URL is not set — skipping migrations"
fi

# Railway injects PORT (commonly 8080). Bind on all interfaces for the edge proxy.
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PORT="${PORT:-8080}"

echo "[HireLens] Starting server on ${HOSTNAME}:${PORT}"
exec node server.js
