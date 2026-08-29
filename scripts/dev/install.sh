#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

ENV_DOCKER=".env.docker"
ENV_DOCKER_EXAMPLE=".env.docker.example"
ENV_LOCAL=".env.local"
ENV_EXAMPLE=".env.example"

die() {
  echo "error: $*" >&2
  exit 1
}

require_docker() {
  command -v docker >/dev/null 2>&1 || die "Docker is required (install Docker Desktop / OrbStack)."
  docker info >/dev/null 2>&1 || die "Docker daemon is not reachable."
  docker compose version >/dev/null 2>&1 || die "Docker Compose is required."
}

copy_if_missing() {
  local src="$1"
  local dest="$2"
  if [[ -f "$dest" ]]; then
    echo "keep  $dest (already exists)"
    return 0
  fi
  [[ -f "$src" ]] || die "Missing example file: $src"
  cp "$src" "$dest"
  echo "create $dest (from $src)"
}

read_env_value() {
  local file="$1"
  local key="$2"
  local raw
  raw="$(grep -E "^${key}=" "$file" | head -n1 | cut -d= -f2- || true)"
  raw="${raw%\"}"
  raw="${raw#\"}"
  printf '%s' "$raw"
}

is_placeholder_password() {
  local value
  value="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"
  [[ -z "$value" ]] && return 0
  case "$value" in
    change-me|changeme|replace-me|quizlink-dev-admin|password|password123) return 0 ;;
  esac
  [[ "$value" == change-me* || "$value" == replace-me* || "$value" == *change-me* ]] && return 0
  return 1
}

set_env_value() {
  local file="$1"
  local key="$2"
  local value="$3"
  local tmp
  tmp="$(mktemp)"
  if grep -qE "^${key}=" "$file"; then
    awk -v key="$key" -v value="$value" '
      BEGIN { done=0 }
      index($0, key "=") == 1 && done == 0 { print key "=" value; done=1; next }
      { print }
      END { if (done == 0) print key "=" value }
    ' "$file" >"$tmp"
  else
    cat "$file" >"$tmp"
    printf '\n%s=%s\n' "$key" "$value" >>"$tmp"
  fi
  mv "$tmp" "$file"
}

ensure_auth_secret() {
  local file="$1"
  [[ -f "$file" ]] || return 0

  local current
  current="$(read_env_value "$file" AUTH_SECRET)"

  if [[ -n "$current" && "$current" != "replace-me-with-openssl-rand-base64-32" && "$current" != "dev-only-change-me-use-openssl-rand" ]]; then
    echo "keep  AUTH_SECRET in $file"
    return 0
  fi

  command -v openssl >/dev/null 2>&1 || die "openssl is required to generate AUTH_SECRET"
  local secret
  secret="$(openssl rand -base64 32)"
  set_env_value "$file" AUTH_SECRET "$secret"
  echo "set   AUTH_SECRET in $file (generated)"
}

# Generate a strong local DEV admin password when missing/placeholder; never overwrite a real value.
ensure_dev_admin_password() {
  local file="$1"
  [[ -f "$file" ]] || return 0

  local current
  current="$(read_env_value "$file" DEV_ADMIN_PASSWORD)"

  if [[ -n "$current" ]] && ! is_placeholder_password "$current"; then
    echo "keep  DEV_ADMIN_PASSWORD in $file"
    DEV_ADMIN_PASSWORD_GENERATED=""
    return 0
  fi

  command -v openssl >/dev/null 2>&1 || die "openssl is required to generate DEV_ADMIN_PASSWORD"
  local password
  password="$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)"
  [[ -n "$password" ]] || die "failed to generate DEV_ADMIN_PASSWORD"

  set_env_value "$file" DEV_ADMIN_PASSWORD "$password"
  if ! grep -qE '^DEV_ADMIN_EMAIL=' "$file"; then
    set_env_value "$file" DEV_ADMIN_EMAIL "admin@quizlink.local"
  fi
  if ! grep -qE '^DEV_ADMIN_NAME=' "$file"; then
    set_env_value "$file" DEV_ADMIN_NAME "QuizLink Dev Admin"
  fi

  DEV_ADMIN_PASSWORD_GENERATED="$password"
  echo "set   DEV_ADMIN_PASSWORD in $file (generated)"
}

compose() {
  docker compose --env-file "$ENV_DOCKER" "$@"
}

wait_for_db() {
  local i
  for i in $(seq 1 60); do
    local status
    status="$(compose ps --format '{{.Service}} {{.Health}}' 2>/dev/null | awk '$1=="db"{print $2; exit}')"
    if [[ "$status" == "healthy" ]]; then
      echo "db is healthy"
      return 0
    fi
    sleep 2
  done
  die "db did not become healthy in time"
}

DEV_ADMIN_PASSWORD_GENERATED=""

require_docker
copy_if_missing "$ENV_DOCKER_EXAMPLE" "$ENV_DOCKER"
copy_if_missing "$ENV_EXAMPLE" "$ENV_LOCAL"
ensure_auth_secret "$ENV_DOCKER"
ensure_dev_admin_password "$ENV_DOCKER"

echo "Building development images..."
compose build

echo "Starting database and Mailpit..."
compose up -d db mailpit
wait_for_db

echo "Applying migrations..."
compose run --rm --no-deps --entrypoint sh app -c "pnpm exec prisma generate && pnpm exec prisma migrate deploy"

ADMIN_EMAIL="$(read_env_value "$ENV_DOCKER" DEV_ADMIN_EMAIL)"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@quizlink.local}"
ADMIN_PASSWORD="$(read_env_value "$ENV_DOCKER" DEV_ADMIN_PASSWORD)"

cat <<EOF

QuizLink install complete.

Next:
  make start
  make fixtures

URLs (after start):
  App      http://localhost:3000
  Mailpit  http://localhost:8025
  Health   http://localhost:3000/api/health

Development admin (DEV only — stored in .env.docker, never commit):
  Email:    ${ADMIN_EMAIL}
  Password: ${ADMIN_PASSWORD}

EOF
