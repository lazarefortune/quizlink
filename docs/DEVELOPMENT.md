# Development

Daily commands assume Docker + Make (`make install` already done).

**Prerequisites for the standard workflow:** Git, Docker, Make — not host Node/pnpm.

## Start / stop

```bash
make start
make stop
make restart
make ps
```

`make stop` keeps volumes (database + question images).

## Logs

```bash
make logs                 # app (default)
make logs SERVICE=db
make logs SERVICE=mailpit
```

## Shells

```bash
make shell                # app container
make db                   # mysql CLI in db container
```

## Migrations

Apply pending migrations (non-destructive):

```bash
make migrate
```

Create a new migration (explicit, interactive Prisma workflow):

```bash
make migration NAME=add_something
```

Never rely on `prisma migrate dev` inside production images.

## Fixtures

```bash
make fixtures             # DEV ONLY
```

See [FIXTURES.md](./FIXTURES.md).

## Tests / lint / build

```bash
make test                 # inside the app container
make lint                 # inside the app container
make health
make build                # Docker production image (`Dockerfile` target production)
make build-local          # optional — requires local Node.js + pnpm
```

## Hot reload

Source is bind-mounted into the app container. Edits on the host reload Next.js.

`node_modules` and `.next` live in named volumes (Linux binaries), not the macOS bind mount.

## Question images

Local storage path inside the container:

`/app/storage/question-images`

Persisted on volume `quizlink_question_images`. Survives `make stop` / `docker compose down` (without `-v`).

## URLs

| Service | URL |
|---------|-----|
| App | http://localhost:3000 |
| Health | http://localhost:3000/api/health |
| Mailpit | http://localhost:8025 |
| MySQL (host) | localhost:`MYSQL_HOST_PORT` (default 3307) |
