#!/usr/bin/env bash
# Shared early guard for make fixtures / fixtures-reset (before any DB work).
set -euo pipefail

if [[ "${NODE_ENV:-}" == "production" ]]; then
  echo "error: fixtures are forbidden when NODE_ENV=production" >&2
  exit 1
fi
