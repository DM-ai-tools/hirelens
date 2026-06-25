#!/bin/sh
set -e

UPLOAD_DIR="${UPLOAD_DIR:-/app/uploads}"
REPORT_DIR="${REPORT_DIR:-/app/reports}"
mkdir -p "$UPLOAD_DIR" "$REPORT_DIR"

PRISMA_MIGRATE_CLI="./prisma-migrate/node_modules/prisma/build/index.js"

if [ -n "$DATABASE_URL" ]; then
  echo "[HireLens] Applying database migrations..."
  if [ -f "$PRISMA_MIGRATE_CLI" ]; then
    node "$PRISMA_MIGRATE_CLI" migrate deploy
  else
    echo "[HireLens] ERROR: Prisma migrate CLI missing at $PRISMA_MIGRATE_CLI"
    exit 1
  fi
else
  echo "[HireLens] WARNING: DATABASE_URL is not set — skipping migrations"
fi

echo "[HireLens] Starting server on ${HOSTNAME:-0.0.0.0}:${PORT:-3000}"
exec node server.js
