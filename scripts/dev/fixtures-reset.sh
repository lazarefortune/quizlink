#!/usr/bin/env bash
# DEV ONLY — interactive confirmation required. No DB work until after YES.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

# Fail before confirmation / DB if host environment marks production.
# shellcheck source=assert-not-production.sh
source "$ROOT_DIR/scripts/dev/assert-not-production.sh"

ENV_DOCKER=".env.docker"
[[ -f "$ENV_DOCKER" ]] || {
  echo "error: missing $ENV_DOCKER — run make install first" >&2
  exit 1
}

echo "WARNING: DEV ONLY. Deletes the DEV admin (DEV_ADMIN_EMAIL) then re-runs fixtures."
echo "Other database rows are not deleted."
printf "Type YES to continue: "
read -r confirmation
[[ "$confirmation" == "YES" ]] || {
  echo "Aborted."
  exit 1
}

docker compose --env-file "$ENV_DOCKER" exec -T \
  -e ALLOW_DEV_FIXTURES=1 \
  -e NODE_ENV="${NODE_ENV:-development}" \
  app pnpm fixtures -- --reset-admin
