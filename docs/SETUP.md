# Guide d'installation

## Prérequis

| Outil | Version requise | Notes |
|-------|----------------|-------|
| Node.js | 20.19+, 22.12+, ou 24.0+ | **23.x non supporté** par Prisma |
| MySQL | 8.0+ | Base de données principale |
| pnpm | dernière version stable | Gestionnaire de paquets du projet |

Si vous êtes sur Node.js 23, utilisez `nvm` pour basculer :
```bash
nvm install 22 && nvm use 22
```

---

## Installation pas à pas

### 1. Installer les dépendances

```bash
pnpm install
```

### 2. Configurer les variables d'environnement

Copier le fichier d'exemple et remplir les valeurs :

```bash
cp .env.example .env
```

**Variables obligatoires :**

```env
# Base de données
DATABASE_URL="mysql://user:password@localhost:3306/quizsnap"

# Auth (générer avec : openssl rand -base64 32)
AUTH_SECRET="votre-secret-aleatoire"
NEXTAUTH_URL="http://localhost:3000"

# URLs de l'app
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

**Variables optionnelles :**

```env
# IA — génération de quiz et rapports participants
OPENAI_API_KEY="sk-..."

# Email — Mailpit en local (ne rien mettre = pas d'email)
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_FROM_EMAIL="noreply@quizlink.local"
SMTP_FROM_NAME="QuizLink"

# Stripe — achat de coins
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLIC_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Analytics
NEXT_PUBLIC_POSTHOG_KEY="phc_..."
# Optional proxy path (default /qk/ph)
# NEXT_PUBLIC_POSTHOG_PROXY_PATH="/qk/ph"

# PostHog Error Tracking source maps (build only — Personal API Key phx_…, NEVER NEXT_PUBLIC_)
# POSTHOG_API_KEY="phx_..."
# POSTHOG_PROJECT_ID="12345"
# NEXT_PUBLIC_POSTHOG_HOST="https://eu.posthog.com"

# Sécurité — pepper pour le hachage d'IP dans les logs d'audit (défaut : AUTH_SECRET)
AUTH_IP_ADDRESS_PEPPER="..."
```

> **Note :** Prisma CLI lit `.env` (pas `.env.local`) pour les migrations. Assurez-vous que `DATABASE_URL` est dans `.env`.

### 3. Générer le client Prisma

```bash
pnpm prisma:generate
```

### 4. Appliquer les migrations

```bash
pnpm prisma:migrate
```

Cette commande crée la base de données si elle n'existe pas, crée toutes les tables et applique les migrations.

### 5. Démarrer l'application

```bash
pnpm dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

---

## Email en local (Mailpit)

Mailpit est un serveur SMTP local qui intercepte les emails sans les envoyer. Idéal pour le développement.

```bash
# macOS
brew install mailpit
mailpit

# ou via Docker
docker run -d -p 1025:1025 -p 8025:8025 axllent/mailpit
```

Interface web : [http://localhost:8025](http://localhost:8025)

Configuration `.env` pour Mailpit :
```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
```

---

## Créer un compte admin

Après avoir créé un compte via l'interface :

```bash
pnpm promote:admin
# Suivre les instructions (entrer l'email du compte)
```

---

## Données de test

```bash
pnpm seed:coin-packs   # Initialiser les packs de coins Stripe
pnpm seed:dev-users    # Créer des utilisateurs de test
```

---

## Troubleshooting

### "Prisma Client not generated"
```bash
pnpm prisma:generate
```

### "JSON.parse: unexpected character" (NextAuth)
`AUTH_SECRET` est manquant ou invalide dans `.env`. Générer un secret :
```bash
openssl rand -base64 32
```

### "Prisma only supports Node.js versions..."
Node.js 23.x n'est pas supporté. Passer à 22.x ou 24.x :
```bash
nvm install 22 && nvm use 22
node --version
```

### Les emails ne partent pas
Vérifier que Mailpit tourne sur le port 1025 et que `SMTP_HOST=localhost` est dans `.env`.

---

## Structure de la base de données (résumé)

| Table | Rôle |
|-------|------|
| `users` | Comptes utilisateurs |
| `quizzes` | Quiz créés |
| `questions` | Questions des quiz |
| `options` | Options de réponse par question |
| `quiz_attempts` | Tentatives d'un participant sur un quiz |
| `quiz_answers` | Réponses individuelles par tentative |
| `participants` | Participants nommés (liens personnalisés) |
| `quiz_links` | Liens personnalisés participant ↔ quiz |
| `coin_transactions` | Historique des crédits/débits de coins |
| `coin_packs` | Packs achetables via Stripe |

> Le schéma complet est dans [prisma/schema.prisma](../prisma/schema.prisma).
