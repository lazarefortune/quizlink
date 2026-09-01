# Dates, locales et fuseaux horaires

QuizLink sépare strictement trois notions :

1. **Instant** — timestamp métier (`createdAt`, `updatedAt`, début/fin de tentative, etc.) stocké et transporté en **UTC** (ISO `2026-08-31T17:25:00.000Z`).
2. **Locale** — langue d'affichage (`fr`, `en`), gérée par le système i18n existant.
3. **Timezone** — fuseau IANA (`Europe/Paris`, `America/Toronto`, …) qui détermine l'heure affichée pour un instant.

## Règles

- Ne jamais convertir un instant avec des additions/soustractions manuelles d'heures.
- Ne jamais formater un instant côté API en texte localisé : renvoyer un ISO UTC, formater à l'affichage.
- Ne jamais déduire la locale depuis le timezone.
- Le serveur, Docker et le VPS peuvent rester en **UTC** : le timezone utilisateur ne dépend pas de la machine.
- Les **dates civiles** (`YYYY-MM-DD`, ex. date de naissance) ne sont **pas** converties selon le timezone : utiliser `formatCalendarDate`.

## Architecture

| Module | Rôle |
|--------|------|
| `lib/date-time/constants.ts` | Cookie `quizlink_timezone`, `DEFAULT_TIME_ZONE` |
| `lib/date-time/timezone.ts` | Validation IANA, détection navigateur, résolution |
| `lib/date-time/format.ts` | Helpers purs `formatDateTime`, `formatDate`, `formatTime`, … |
| `lib/date-time/server.ts` | `getRequestTimeZone()` pour le SSR |
| `lib/date-time/actions.ts` | `syncTimeZoneAction` — écriture cookie |
| `lib/date-time/timezone-provider.tsx` | Contexte `useTimeZone()` |
| `lib/date-time/timezone-sync.tsx` | Sync post-hydratation sans mismatch |

## SSR / hydration

1. Le layout racine lit le cookie `quizlink_timezone` (ou le fallback).
2. `TimeZoneProvider` initialise le contexte client avec **exactement** cette valeur.
3. `TimeZoneSync` compare après mount avec `Intl.DateTimeFormat().resolvedOptions().timeZone` et synchronise le cookie si nécessaire (une seule fois, puis `router.refresh()`).

## Usage

**Server Component :**

```ts
const timeZone = await getRequestTimeZone();
formatDateTime(row.createdAt, locale, timeZone);
```

**Client Component :**

```tsx
const { timeZone } = useTimeZone();
formatDateTime(value, locale, timeZone);
// ou
<FormattedDate date={value} locale={locale} />
```

**Préférence manuelle (extension future) :**

`getRequestTimeZone({ userTimeZone: user.timeZone })` — `null` = automatique.

## Emails

Les emails admin utilisent `DEFAULT_TIME_ZONE` faute de timezone utilisateur disponible côté envoi batch. Prévoir le passage d'un `timeZone` explicite lorsque le contexte requête est disponible.
