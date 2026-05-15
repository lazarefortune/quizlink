# Architecture

## Stack technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Framework | Next.js App Router | 15.x |
| Langage | TypeScript | 5.x |
| UI | Tailwind CSS + shadcn/ui + Radix UI | — |
| ORM | Prisma | 6.x |
| Base de données | MySQL | 8.0+ |
| Auth | NextAuth v5 (beta) | 5.0.0-beta |
| IA | OpenAI SDK | gpt-4o-mini |
| Paiement | Stripe | 20.x |
| Email | Nodemailer | 7.x |
| Analytics | PostHog | — |
| Tests | Vitest | 4.x |
| Animations | Framer Motion + Embla Carousel | — |
| PDF | jsPDF (client), pdf-parse (server) | — |

---

## Structure des dossiers

```
quizsnap/
├── app/                    # Routes Next.js (App Router)
│   ├── (admin)/            # Interface admin (rôle ADMIN requis)
│   ├── (app)/              # Espace connecté (dashboard, builder, generate…)
│   ├── (p)/                # Pages publiques (quiz via token)
│   ├── (public)/           # Pages publiques (landing, pricing, legal…)
│   ├── api/                # Routes API (auth, Stripe, coin-packs)
│   └── layout.tsx          # Layout racine (header, footer, providers)
│
├── components/             # Composants React réutilisables
│   ├── ui/                 # Composants shadcn/ui
│   ├── auth/               # Panneaux latéraux des pages auth
│   ├── builder/            # Composants du quiz builder
│   ├── dashboard/          # Shell, sidebar, topbar du dashboard
│   ├── landing/            # Sections de la page d'accueil
│   └── quiz/               # Composants de passage de quiz
│
├── lib/                    # Logique métier et utilitaires
│   ├── ai/                 # Génération IA (quiz, rapports)
│   ├── analytics/          # Agrégation des données participants
│   ├── builder/            # Logique du builder
│   ├── i18n/               # Internationalisation
│   ├── quiz/               # Logique de session quiz
│   ├── schemas/            # Schémas Zod partagés
│   ├── stripe/             # Intégration Stripe
│   ├── storage/            # Gestion des fichiers (images questions)
│   ├── auth.ts             # Config NextAuth
│   ├── coins.ts            # Système de coins
│   ├── email.ts            # Envoi d'emails
│   └── prisma.ts           # Singleton Prisma client
│
├── prisma/                 # Schéma et migrations BDD
├── scripts/                # Scripts de maintenance et one-shot
├── docs/                   # Documentation du projet
└── public/                 # Assets statiques
```

---

## Conventions

### Routes et layouts

- Les groupes de routes `(admin)`, `(app)`, `(p)`, `(public)` n'influencent pas l'URL mais permettent d'appliquer des layouts différents.
- Chaque layout protège ses routes : `(app)` redirige vers `/auth/signin` si non connecté, `(admin)` redirige vers `/dashboard` si pas ADMIN.
- Les pages complexes sont découpées en `page.tsx` (données serveur) + `page-content.tsx` (composant client).

### Server Actions

Les mutations passent par des fichiers `actions.ts` colocalisés avec la page qui les utilise. Pas de routes API dédiées sauf pour les webhooks (Stripe) et NextAuth.

### Schémas de validation

Tous les inputs sont validés avec **Zod**. Les schémas partagés entre client et serveur sont dans `lib/schemas/`.

### Système de coins

Les actions IA consomment des coins :
- Génération de quiz : coût variable selon le nombre de questions
- Rapport participant : 4 coins (`COINS_PER_REPORT`)

La déduction se fait **après** une génération réussie. Les ADMIN peuvent aller en négatif (`allowNegativeBalance`).

### Internationalisation (i18n)

L'i18n est géré dans `lib/i18n/`. La locale est stockée dans le profil utilisateur. Les emails et rapports IA respectent la locale.

### Images des questions

Les images sont stockées côté serveur (voir `lib/storage/`). Le builder encode les images en base64 pour les previews, la taille max du body des Server Actions est augmentée dans `next.config.ts`.

### Analytics

PostHog est proxifié via Next.js rewrites pour contourner les bloqueurs. Le proxy path est configurable via `NEXT_PUBLIC_POSTHOG_PROXY_PATH` (défaut : `/qk/ph`).

---

## Flux de données clés

### Génération d'un quiz par IA

```
/generate (page) → Server Action → lib/ai/ → OpenAI API
                                 → Prisma (sauvegarder le quiz)
                                 → Déduire coins
                                 → Redirect /builder/[quizId]
```

### Passage d'un quiz

```
/quiz/[token] → valider le token → afficher intro
             → /quiz/[token]/play → soumettre réponses (Server Action)
             → créer QuizAttempt + QuizAnswers
             → redirect /quiz/[token]/results/[attemptId]
```

### Rapport participant IA

Voir [QUIZ_REPORT_GENERATION.md](QUIZ_REPORT_GENERATION.md) pour le détail complet.

---

## Tests

Les tests unitaires sont colocalisés avec le code (`*.test.ts` / `*.test.tsx`) dans `lib/`.

```bash
pnpm test:run    # Une fois
pnpm test        # Watch mode
pnpm test:ui     # Interface Vitest
```

Les fichiers testés couvrent principalement la logique métier pure (`lib/`) : scoring, validation, formatage, filtres.
