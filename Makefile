# QuizLink developer facade — prefer these targets over raw docker/pnpm commands.
# Discover commands: make help
#
# Onboarding prerequisites: Git, Docker, Make (no host Node/pnpm required).

SHELL := /bin/bash
.DEFAULT_GOAL := help

ENV_DOCKER := .env.docker
COMPOSE := docker compose --env-file $(ENV_DOCKER)
SERVICE ?= app
APP_PORT ?= 3000
PRODUCTION_IMAGE ?= quizlink:local

.PHONY: help install start stop restart logs ps shell db migrate migration fixtures fixtures-reset test lint build build-local health

help:
	@echo "QuizLink development commands"
	@echo ""
	@echo "  Prerequisites: Git, Docker, Make"
	@echo ""
	@echo "  install          Prepare development environment"
	@echo "  start            Start QuizLink (Docker)"
	@echo "  stop             Stop containers (keep volumes)"
	@echo "  restart          Restart environment"
	@echo "  logs             Follow logs (SERVICE=app|db|mailpit)"
	@echo "  ps               Show containers"
	@echo "  shell            Open application shell"
	@echo "  db               Open MySQL shell"
	@echo "  migrate          Apply database migrations (deploy)"
	@echo "  migration        Create a migration (NAME=...)"
	@echo "  fixtures         Load development fixtures (DEV ONLY)"
	@echo "  fixtures-reset   DEV ONLY — recreate DEV admin (confirm)"
	@echo "  test             Run test suite (in app container)"
	@echo "  lint             Run linter (in app container)"
	@echo "  build            Build production Docker image"
	@echo "  build-local      Optional host Next.js build (requires local pnpm)"
	@echo "  health           Check /api/health"
	@echo ""
	@echo "Env file: $(ENV_DOCKER)  (from .env.docker.example)"

install:
	@chmod +x scripts/dev/install.sh scripts/dev/fixtures-reset.sh scripts/dev/assert-not-production.sh docker/dev-entrypoint.sh
	@./scripts/dev/install.sh

start:
	@test -f $(ENV_DOCKER) || (echo "Missing $(ENV_DOCKER). Run: make install" >&2; exit 1)
	$(COMPOSE) up -d --build
	@echo "QuizLink → http://localhost:$(APP_PORT)"

stop:
	@if [ -f $(ENV_DOCKER) ]; then $(COMPOSE) stop; else docker compose stop; fi

restart: stop start

logs:
	@test -f $(ENV_DOCKER) || (echo "Missing $(ENV_DOCKER). Run: make install" >&2; exit 1)
	$(COMPOSE) logs -f $(SERVICE)

ps:
	@if [ -f $(ENV_DOCKER) ]; then $(COMPOSE) ps; else docker compose ps; fi

shell:
	@test -f $(ENV_DOCKER) || (echo "Missing $(ENV_DOCKER). Run: make install" >&2; exit 1)
	$(COMPOSE) exec app sh

db:
	@test -f $(ENV_DOCKER) || (echo "Missing $(ENV_DOCKER). Run: make install" >&2; exit 1)
	$(COMPOSE) exec db sh -c 'mysql -u"$$MYSQL_USER" -p"$$MYSQL_PASSWORD" "$$MYSQL_DATABASE"'

migrate:
	@test -f $(ENV_DOCKER) || (echo "Missing $(ENV_DOCKER). Run: make install" >&2; exit 1)
	$(COMPOSE) exec app pnpm exec prisma migrate deploy

migration:
	@test -f $(ENV_DOCKER) || (echo "Missing $(ENV_DOCKER). Run: make install" >&2; exit 1)
	@test -n "$(NAME)" || (echo "Usage: make migration NAME=add_something" >&2; exit 1)
	$(COMPOSE) exec app pnpm exec prisma migrate dev --name "$(NAME)"

fixtures:
	@./scripts/dev/assert-not-production.sh
	@test -f $(ENV_DOCKER) || (echo "Missing $(ENV_DOCKER). Run: make install" >&2; exit 1)
	$(COMPOSE) exec \
		-e ALLOW_DEV_FIXTURES=1 \
		-e NODE_ENV=$${NODE_ENV:-development} \
		app pnpm fixtures

fixtures-reset:
	@chmod +x scripts/dev/fixtures-reset.sh scripts/dev/assert-not-production.sh
	@./scripts/dev/fixtures-reset.sh

test:
	@test -f $(ENV_DOCKER) || (echo "Missing $(ENV_DOCKER). Run: make install" >&2; exit 1)
	$(COMPOSE) exec -e SMTP_FROM= -e SMTP_FROM_NAME= -e SMTP_HOST= -e SMTP_PORT= -e SMTP_PASS= -e SMTP_USER= app pnpm test:run

lint:
	@test -f $(ENV_DOCKER) || (echo "Missing $(ENV_DOCKER). Run: make install" >&2; exit 1)
	$(COMPOSE) exec app pnpm lint

# Docker-first: validates the production image target (no host Node/pnpm).
build:
	@command -v docker >/dev/null 2>&1 || (echo "Docker is required for make build" >&2; exit 1)
	docker build --target production -t $(PRODUCTION_IMAGE) .
	@echo "Built image: $(PRODUCTION_IMAGE)"

# Optional maintainer path — requires local Node.js + pnpm.
build-local:
	@command -v pnpm >/dev/null 2>&1 || (echo "pnpm is required on the host for make build-local" >&2; exit 1)
	STRIPE_SECRET_KEY=$${STRIPE_SECRET_KEY:-sk_test_build_placeholder} \
	AUTH_SECRET=$${AUTH_SECRET:-build-time-placeholder} \
	DATABASE_URL=$${DATABASE_URL:-mysql://build:build@127.0.0.1:3306/build} \
	pnpm build

health:
	@curl -fsS "http://localhost:$(APP_PORT)/api/health"
	@echo
