# Docker

Technical notes for the QuizLink Docker setup.

## Services (development)

```
┌──────────────────────────────────────────────┐
│ docker compose --env-file .env.docker        │
│                                              │
│  app   Next.js (dev)     host :3000          │
│  db    MySQL 8.4         host :MYSQL_HOST_PORT│
│                          container db:3306   │
│  mailpit                 :1025 / :8025       │
└──────────────────────────────────────────────┘
```

Files:

| File | Role |
|------|------|
| `compose.yaml` | Dev stack (default) |
| `compose.prod.yaml` | Prod-oriented stack (not deployed yet) |
| `Dockerfile` | Multi-stage: `deps`, `development`, `builder`, `migrate`, `production` |
| `.env.docker` | Compose interpolation + container env |

## Env separation

| File | Consumer |
|------|----------|
| `.env.docker` | Docker Compose (`make` always passes `--env-file .env.docker`) |
| `.env.local` | Next.js / host CLI scripts |

Compose also lists `env_file: .env.docker` on `app`. Critical values (`DATABASE_URL`, `SMTP_HOST`) are set in `environment:` so host `localhost` URLs cannot break container networking.

## Ports: host vs container

| Concern | Value |
|---------|--------|
| MySQL inside the network | always `db:3306` |
| MySQL on the developer machine | `localhost:${MYSQL_HOST_PORT:-3307}` |
| App `DATABASE_URL` | `mysql://USER:PASS@db:3306/DB` (ignores `MYSQL_HOST_PORT`) |

Changing `MYSQL_HOST_PORT` only remaps the published host port.

## Volumes

| Volume | Data |
|--------|------|
| `quizlink_mysql_data` | MySQL files |
| `quizlink_question_images` | Uploaded question images |
| `quizlink_node_modules` | Container `node_modules` |
| `quizlink_next` | `.next` cache |

## Mailpit

Dev-only SMTP catcher. Compose forces `SMTP_HOST=mailpit` for `app`.
UI: http://localhost:8025

Production must use a real SMTP server — never Mailpit.

## Healthchecks

- `db`: `mysqladmin ping`
- `app`: `GET /api/health` (DB `SELECT 1`, HTTP 200/503)

## Production image targets

```bash
make build
# equivalent: docker build --target production -t quizlink:local .

docker build --target migrate -t registry.example/quizlink-migrate:<git-sha> .
```

- `make build` / `production`: Next.js `output: "standalone"`, non-root user (no host pnpm)
- `make build-local`: optional host `pnpm build` for maintainers (requires local Node/pnpm)
- `migrate`: `prisma migrate deploy` only

See [DEPLOYMENT.md](./DEPLOYMENT.md) for status (CI/VPS not implemented yet).

## Base image

`node:22-bookworm-slim` (Debian), not Alpine — reliable native deps for Prisma, `pdf-parse` (`@napi-rs/canvas`), and the MariaDB driver adapter.
