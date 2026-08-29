# Deployment

## Current status

**NOT YET IMPLEMENTED** for containerized CI → registry → VPS.

Today’s GitLab job still SSHs to the VPS and runs the existing host deploy script.
This document describes the **intended** Docker path only.

## Intended future flow

```
build image (git SHA tag)
  → push registry
  → VPS pull
  → prisma migrate deploy (migrate image)
  → docker compose -f compose.prod.yaml up -d
  → healthcheck GET /api/health
```

Relevant artifacts already in the repo:

| Artifact | Role |
|----------|------|
| `Dockerfile` targets `production` / `migrate` | Immutable app + migrate job |
| `compose.prod.yaml` | Prod-oriented Compose (`QUIZLINK_IMAGE`, no Mailpit, DB not published) |
| `GET /api/health` | Readiness probe |

## Do not

- Use Mailpit in production
- Publish MySQL ports publicly
- Run `prisma migrate dev` in production
- Auto-run destructive resets
- Treat this doc as an implemented pipeline

When CI/VPS work starts, update this file with concrete commands and registry names.
