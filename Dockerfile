# syntax=docker/dockerfile:1
#
# Debian slim (not Alpine): reliable native deps for @napi-rs/canvas (pdf-parse),
# Prisma, OpenSSL, and the mariadb driver used by @prisma/adapter-mariadb.

ARG NODE_VERSION=22
ARG PNPM_VERSION=10.33.0

FROM node:${NODE_VERSION}-bookworm-slim AS base

ARG PNPM_VERSION
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    openssl \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare "pnpm@${PNPM_VERSION}" --activate

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./

# Prisma 7 prisma.config.ts requires DATABASE_URL even for `prisma generate`.
ENV DATABASE_URL="mysql://build:build@127.0.0.1:3306/build"

RUN pnpm install --frozen-lockfile

FROM base AS development

ENV NODE_ENV=development
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/generated ./generated
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY docker/dev-entrypoint.sh /usr/local/bin/quizlink-dev-entrypoint.sh

RUN chmod +x /usr/local/bin/quizlink-dev-entrypoint.sh

EXPOSE 3000

CMD ["quizlink-dev-entrypoint.sh"]

FROM base AS builder

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/generated ./generated
COPY . .

# NEXT_PUBLIC_* are inlined at build time — pass real values via build-args in CI.
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_BASE_URL=http://localhost:3000
ARG NEXT_PUBLIC_POSTHOG_KEY=
ARG NEXT_PUBLIC_POSTHOG_PROXY_PATH=
ARG NEXT_PUBLIC_POSTHOG_HOST=
ARG POSTHOG_API_KEY=
ARG POSTHOG_PROJECT_ID=
ARG POSTHOG_SOURCEMAPS_DISABLED=1

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY \
    NEXT_PUBLIC_POSTHOG_PROXY_PATH=$NEXT_PUBLIC_POSTHOG_PROXY_PATH \
    NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST \
    POSTHOG_API_KEY=$POSTHOG_API_KEY \
    POSTHOG_PROJECT_ID=$POSTHOG_PROJECT_ID \
    POSTHOG_SOURCEMAPS_DISABLED=$POSTHOG_SOURCEMAPS_DISABLED

# Placeholders only — Stripe client throws at import if STRIPE_SECRET_KEY is unset.
ENV DATABASE_URL="mysql://build:build@127.0.0.1:3306/build" \
    AUTH_SECRET="build-time-placeholder-not-a-real-secret" \
    STRIPE_SECRET_KEY="sk_test_build_placeholder" \
    NEXTAUTH_URL="http://localhost:3000"

RUN pnpm exec prisma generate \
  && pnpm exec next build

# One-shot migrate image — never use `prisma migrate dev` here.
FROM base AS migrate

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/prisma ./prisma
COPY --from=deps /app/prisma.config.ts ./prisma.config.ts

CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]

FROM base AS production

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN groupadd --system --gid 1001 quizlink \
  && useradd --system --uid 1001 --gid quizlink --home /app --shell /usr/sbin/nologin quizlink \
  && mkdir -p /app/storage/question-images \
  && chown -R quizlink:quizlink /app

COPY --from=builder --chown=quizlink:quizlink /app/.next/standalone ./
COPY --from=builder --chown=quizlink:quizlink /app/.next/static ./.next/static
COPY --from=builder --chown=quizlink:quizlink /app/public ./public
COPY --from=builder --chown=quizlink:quizlink /app/generated ./generated

USER quizlink

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/api/health" || exit 1

# Migrations are explicit (migrate image / CI) — not on every app start.
CMD ["node", "server.js"]
