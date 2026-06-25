#!/bin/sh
set -e

UPLOAD_DIR="${UPLOAD_DIR:-/app/uploads}"
REPORT_DIR="${REPORT_DIR:-/app/reports}"
mkdir -p "$UPLOAD_DIR" "$REPORT_DIR"

if [ -n "$DATABASE_URL" ]; then
  echo "[HireLens] Applying database migrations..."
  if [ -x "./prisma-migrate/node_modules/.bin/prisma" ]; then
    ./prisma-migrate/node_modules/.bin/prisma migrate deploy
  elif [ -x "./node_modules/.bin/prisma" ]; then
    ./node_modules/.bin/prisma migrate deploy
  else
    npx prisma migrate deploy
  fi
else
  echo "[HireLens] WARNING: DATABASE_URL is not set — skipping migrations"
fi

echo "[HireLens] Starting server on ${HOSTNAME:-0.0.0.0}:${PORT:-3000}"
exec node server.js
