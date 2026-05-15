# QuizLink

Application web de création et partage de quiz, avec génération automatique par IA.

## Démarrage rapide

```bash
pnpm install
cp .env.example .env   # remplir les variables (voir docs/SETUP.md)
pnpm prisma:migrate
pnpm dev               # http://localhost:3000
```

> Instructions complètes → [docs/SETUP.md](docs/SETUP.md)

---

## Fonctionnalités principales

- **Génération IA** — coller un texte ou importer un PDF, obtenir un quiz en quelques secondes
- **Builder manuel** — créer et éditer des quiz question par question (QCM, Vrai/Faux, cases à cocher)
- **Partage via lien** — token public ou liens personnalisés envoyés par email à des participants nommés
- **Suivi participants** — tentatives, scores, rapport IA détaillé (forces/faiblesses, plan de révision 7 jours)
- **Système de coins** — chaque action IA consomme des coins ; achat via Stripe
- **Admin** — gestion des utilisateurs, crédits manuels, packs de coins, feedbacks

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui + Radix UI |
| Base de données | MySQL + Prisma ORM |
| Auth | NextAuth v5 (beta) |
| IA | OpenAI (gpt-4o-mini) |
| Paiement | Stripe |
| Email | Nodemailer (Mailpit en local) |
| Analytics | PostHog |
| Tests | Vitest |

---

## Documentation

| Document | Contenu |
|----------|---------|
| [docs/SETUP.md](docs/SETUP.md) | Installation, variables d'env, BDD, troubleshooting |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Structure des dossiers, conventions, patterns clés |
| [docs/STRUCTURE-APP.md](docs/STRUCTURE-APP.md) | Routes, pages, redirections, contrôles d'accès |
| [docs/QUIZ_REPORT_GENERATION.md](docs/QUIZ_REPORT_GENERATION.md) | Génération de rapports IA pour participants |
| [docs/PRD.md](docs/PRD.md) | Vision produit et périmètre fonctionnel |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Backlog et fonctionnalités à venir |

---

## Commandes utiles

```bash
# Développement
pnpm dev                  # Serveur de dev
pnpm build                # Build production
pnpm start                # Démarrer en mode production

# Tests
pnpm test:run             # Lancer les tests une fois
pnpm test                 # Mode watch

# Base de données
pnpm prisma:migrate       # Appliquer les migrations
pnpm prisma:generate      # Régénérer le client Prisma
pnpm prisma:studio        # Interface Prisma Studio

# Utilitaires
pnpm promote:admin        # Promouvoir un utilisateur en ADMIN
pnpm seed:coin-packs      # Initialiser les packs de coins
pnpm seed:dev-users       # Créer des utilisateurs de test
```
