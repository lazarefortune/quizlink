# Setup

Get QuizLink running locally with Docker in a few minutes.

## Prerequisites

- Git
- Docker (Docker Desktop or OrbStack)
- Make
- `openssl` (used by `make install` to generate secrets)

You do **not** need Node.js, pnpm, a local MySQL, or Mailpit for the standard Docker workflow.

## First installation

```bash
git clone <repo-url>
cd quizlink
make install
make start
make fixtures
```

`make install` will:

1. Check Docker
2. Create `.env.docker` and `.env.local` **only if missing** (never overwrites)
3. Generate `AUTH_SECRET` and a strong `DEV_ADMIN_PASSWORD` when still placeholders
4. Build development images
5. Start MySQL + Mailpit
6. Apply Prisma migrations (`migrate deploy`)
7. Print the DEV admin email/password (stored only in `.env.docker`)

Then open:

| Service | URL |
|---------|-----|
| App | http://localhost:3000 |
| Mailpit | http://localhost:8025 |
| Health | http://localhost:3000/api/health |

Sign in with the DEV admin credentials printed by `make install` (also in `.env.docker`).

## Environment

| File | Purpose |
|------|---------|
| `.env.docker` | Compose + container env (`make` always passes `--env-file .env.docker`) |
| `.env.local` | Optional host tooling (from `.env.example`) |

Do not put Docker hostnames like `db` into `.env.local` for Compose.
Compose builds `DATABASE_URL` as `mysql://…@db:3306/…` for the app container.

SMTP in containers uses `SMTP_HOST=mailpit` (forced by Compose).
The application code reads `SMTP_FROM` / `SMTP_PASS` (not `SMTP_FROM_EMAIL` / `SMTP_PASSWORD`).

## Verify

```bash
make ps
make health
curl -fsS http://localhost:8025 >/dev/null && echo mailpit_ok
```

## MySQL host port

Inside Docker, MySQL always listens on **`db:3306`**.

On your machine, the published port defaults to **3307** (avoids clashing with a local MySQL on 3306):

```env
# .env.docker
MYSQL_HOST_PORT=3307
```

Change only the host mapping:

```env
MYSQL_HOST_PORT=3308
```

```bash
make restart
```

- Host tools: `localhost:3308`
- App container: still `db:3306` (unchanged)

## Optional: without Docker

Requires local Node.js + pnpm + MySQL:

```bash
cp .env.example .env.local
# set DATABASE_URL to your local MySQL
pnpm install
pnpm prisma:migrate
pnpm dev
```

See also [DEVELOPMENT.md](./DEVELOPMENT.md).
