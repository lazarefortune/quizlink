# Scripts CLI (maintenance, audit, one-shot)

Les chemins d’import vers `lib/` sont relatifs à chaque sous-dossier (`../../lib/...`).

## `scripts/audit/` — audits réutilisables

| Script | Rôle |
|--------|------|
| `audit-question-images-storage.ts` | Cohérence `Question.imageKey` ↔ fichiers `QUESTION_IMAGE_UPLOAD_DIR` |

```bash
npx tsx scripts/audit/audit-question-images-storage.ts --dry-run
```

Helpers / tests : `audit-question-images-storage.helpers.ts`, `*.helpers.test.ts`.

## `scripts/maintenance/` — opérations réutilisables

| Script | Rôle |
|--------|------|
| `cleanup-anonymous-attempts.ts` | Nettoyage / audit des tentatives anonymes legacy |
| `promote-admin.ts` | Promotion utilisateur → `ADMIN` |
| `seed-coin-packs.ts` | Graines des packs de pièces |
| `seed-dev-users.ts` | Données de dev (utilisateurs + événements) |

Raccourcis `package.json` : `promote:admin`, `seed:coin-packs`, `seed:dev-users`, `backfill:signup-events` (voir one-shot).

## `scripts/one-shot/` — migrations / backfills ponctuels

À n’utiliser qu’avec `--dry-run` puis validation avant tout `--confirm` ou écriture destructive.

| Script | Rôle |
|--------|------|
| `migrate-question-images-to-storage.ts` | Data URL `Question.image` → stockage + `imageKey` |
| `backfill-anonymous-quiz-link-stats.ts` | Reconstruction `quiz_link_anonymous_stats` |
| `backfill-signup-events.ts` | Événements `SIGNUP` manquants (`pnpm run backfill:signup-events`) |

```bash
npx tsx scripts/one-shot/migrate-question-images-to-storage.ts --dry-run
npx tsx scripts/one-shot/backfill-anonymous-quiz-link-stats.ts --dry-run
```
