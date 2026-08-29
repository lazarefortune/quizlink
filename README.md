<p align="center">
  <img src="./public/logo-quizlink.png" alt="QuizLink" width="120" />
</p>

# QuizLink

Create, share, and analyze quizzes — with optional AI generation.

**Stack:** Next.js 16 · React 19 · TypeScript · Prisma · MySQL · pnpm · Docker · NextAuth · Stripe · PostHog

**Prerequisites (Docker workflow):** Git · Docker · Make — no host Node/pnpm required.

## Quick start

```bash
git clone <repo-url>
cd quizlink
make install
make start
make fixtures
```

| Service | URL |
|---------|-----|
| QuizLink | http://localhost:3000 |
| Mailpit | http://localhost:8025 |
| Health | http://localhost:3000/api/health |

DEV admin credentials are printed by `make install` and stored only in gitignored `.env.docker`.

## Frequent commands

```bash
make help
make start
make stop
make logs
make test
make fixtures
make build                # production Docker image
```

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/SETUP.md](docs/SETUP.md) | First-time setup |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Day-to-day workflow |
| [docs/DOCKER.md](docs/DOCKER.md) | Docker architecture |
| [docs/FIXTURES.md](docs/FIXTURES.md) | Dev fixtures & admin |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deployment status |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | App structure |
| [docs/STRUCTURE-APP.md](docs/STRUCTURE-APP.md) | Routes & access |

## Environment files

| File | Role | Git |
|------|------|-----|
| `.env.example` | App variable catalogue | tracked |
| `.env.local` | Local Next.js / host tooling | ignored |
| `.env.docker.example` | Docker Compose catalogue | tracked |
| `.env.docker` | Docker Compose local config | ignored |

Make always uses `docker compose --env-file .env.docker`.
