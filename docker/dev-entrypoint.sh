#!/bin/sh
set -eu

# Named volume for node_modules starts empty and shadows the image layer.
if [ ! -x node_modules/.bin/next ]; then
  echo "[quizlink] Installing dependencies into container volume..."
  pnpm install --frozen-lockfile
fi

pnpm exec prisma generate
# Non-destructive: applies pending migrations only (never prisma migrate dev).
pnpm exec prisma migrate deploy

exec pnpm dev -H 0.0.0.0 -p 3000
