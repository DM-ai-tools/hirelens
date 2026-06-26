FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat chromium nss freetype harfbuzz ca-certificates ttf-freefont
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

FROM base AS migrate-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
# Full production dependency tree for `prisma migrate deploy` at container start.
RUN npm ci --omit=dev --ignore-scripts

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG APP_BUILD_ID=assessment-download-fix
RUN echo "HireLens build ${APP_BUILD_ID}"
ENV NEXT_TELEMETRY_DISABLED=1
# Placeholder only for `next build` — real DATABASE_URL is set at runtime on Railway.
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public"
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/scripts/start-production.sh ./scripts/start-production.sh

COPY --from=migrate-deps /app/node_modules ./prisma-migrate/node_modules

# prisma.config.ts resolves imports from /app — expose migrate CLI deps (dotenv, etc.).
COPY --from=migrate-deps /app/node_modules/dotenv ./node_modules/dotenv

# Next.js standalone ships a partial Prisma CLI without transitive deps (e.g. effect).
RUN rm -f ./node_modules/.bin/prisma ./node_modules/.bin/prisma.cmd 2>/dev/null || true \
  && rm -rf ./node_modules/prisma 2>/dev/null || true

RUN chmod +x ./scripts/start-production.sh \
  && chmod -R a+rX ./prisma-migrate/node_modules \
  && test -f ./prisma-migrate/node_modules/dotenv/package.json \
  && test -f ./prisma-migrate/node_modules/effect/package.json \
  && test -f ./node_modules/dotenv/package.json \
  && test -f ./prisma-migrate/node_modules/prisma/build/index.js \
  && mkdir -p uploads reports .next/cache \
  && chown -R nextjs:nodejs uploads reports .next prisma-migrate scripts/start-production.sh

USER nextjs
EXPOSE 8080

CMD ["sh", "scripts/start-production.sh"]
