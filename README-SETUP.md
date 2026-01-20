# Setup Guide - QuizSnap

## Prérequis

- Node.js 20.19+, 22.12+, ou 24.0+ (requis pour Prisma)
  - **IMPORTANT:** Node.js 23.x n'est **PAS** supporté par Prisma
  - Si vous avez Node.js 23, utilisez `nvm` pour passer à Node.js 22.12+ ou 24.0+
- MySQL database
- pnpm (gestionnaire de paquets)

## Installation

### 1. Installer les dépendances

```bash
pnpm install
```

### 2. Configurer les variables d'environnement

**IMPORTANT:** Créer un fichier `.env` à la racine du projet (Prisma CLI lit `.env` par défaut pour les migrations).

Vous pouvez aussi créer `.env.local` pour Next.js, mais assurez-vous que `.env` contient au moins `DATABASE_URL` pour que Prisma fonctionne.

```env
# Database (requis pour Prisma)
DATABASE_URL="mysql://user:password@localhost:3306/quizsnap"

# NextAuth (requis pour l'authentification)
AUTH_SECRET="votre-secret-aleatoire-ici"
# Vous pouvez générer un secret avec: openssl rand -base64 32

# Optionnel: URL de l'application
NEXTAUTH_URL="http://localhost:3000"

# Optionnel: OpenAI API Key (pour la génération de quiz avec IA)
OPENAI_API_KEY="votre-cle-api-openai"

# Email Configuration (pour la vérification d'email et la réinitialisation de mot de passe)
# En développement local, utilisez Mailpit (par défaut: localhost:1025)
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_FROM="noreply@quizsnap.com"

# Pour la production, configurez votre SMTP:
# SMTP_HOST="smtp.example.com"
# SMTP_PORT="587"
# SMTP_SECURE="false"
# SMTP_USER="votre-email@example.com"
# SMTP_PASS="votre-mot-de-passe"
```

**Note:** Le fichier `.env` est déjà dans `.gitignore`, donc vos credentials ne seront pas commités.

### 3. Générer le client Prisma

```bash
pnpm prisma:generate
```

**Note:** Si vous obtenez une erreur concernant la version de Node.js, vous devez mettre à jour Node.js vers une version compatible (20.19+, 22.12+, ou 24.0+).

### 4. Créer la base de données et les tables

```bash
pnpm prisma:migrate
```

Cela va :
- Créer la base de données si elle n'existe pas
- Créer toutes les tables nécessaires
- Appliquer les migrations

### 5. (Optionnel) Ouvrir Prisma Studio

Pour visualiser et gérer votre base de données :

```bash
pnpm prisma:studio
```

## Démarrer l'application

```bash
pnpm dev
```

L'application sera accessible sur `http://localhost:3000`

## Résolution de problèmes

### Erreur: "Prisma Client not generated"

Exécutez `pnpm prisma:generate` pour générer le client Prisma.

### Erreur: "JSON.parse: unexpected character" (NextAuth)

Assurez-vous que `AUTH_SECRET` est défini dans `.env.local`. Vous pouvez générer un secret avec :

```bash
openssl rand -base64 32
```

### Erreur: "Prisma only supports Node.js versions..."

Mettez à jour Node.js vers une version compatible :
- Node.js 20.19+
- Node.js 22.12+
- Node.js 24.0+

**Node.js 23.x n'est PAS supporté par Prisma.**

Si vous utilisez `nvm` (Node Version Manager) :

```bash
# Installer Node.js 22 (LTS)
nvm install 22
nvm use 22

# Ou installer Node.js 24
nvm install 24
nvm use 24

# Vérifier la version
node --version
```

Si vous n'utilisez pas nvm, téléchargez une version compatible depuis [nodejs.org](https://nodejs.org/).

## Structure de la base de données

- `users` - Utilisateurs authentifiés
- `quizzes` - Quiz créés
- `questions` - Questions des quiz
- `options` - Options de réponse
- `quiz_attempts` - Tentatives de quiz
- `quiz_answers` - Réponses aux questions
