# Structure de l'application QuizLink

Ce document décrit la structure des dossiers, les pages, leur contenu et les interactions entre elles.

---

## 1. Structure générale du projet

```
quizsnap/
├── app/                    # Routes Next.js (App Router)
│   ├── account/            # Compte utilisateur (profil, email, sécurité, coins)
│   ├── admin/              # Interface administrateur (réservée rôle ADMIN)
│   ├── api/                # Routes API (auth, Stripe, coin-packs)
│   ├── auth/               # Authentification (signin, signup, forgot/reset password, verify-email)
│   ├── builder/            # Création manuelle de quiz
│   ├── dashboard/          # Espace utilisateur connecté (quiz, participants)
│   ├── generate/           # Génération de quiz par IA (texte / PDF)
│   ├── legal/              # Mentions légales
│   ├── pricing/            # Tarifs et achat de coins
│   ├── quiz/               # Jouer à un quiz (par token public ou personnalisé)
│   └── quiz-link/          # Actions partagées pour les liens quiz
├── components/             # Composants React réutilisables
│   ├── auth/               # Panneaux latéraux des pages auth
│   ├── dashboard/          # Sidebar, topbar, shell du dashboard
│   ├── landing/            # Sections de la page d'accueil
│   ├── ui/                 # Composants UI (boutons, cartes, modales…)
│   └── ...
├── lib/                    # Logique métier, auth, i18n, email, Stripe, IA…
└── prisma/                 # Schéma et migrations BDD
```

---

## 2. Layouts et protection des routes

| Layout | Fichier | Rôle |
|--------|---------|------|
| **Root** | `app/layout.tsx` | Header, Footer, thème, i18n, session. S’applique à toute l’app. |
| **Auth** | `app/auth/layout.tsx` | Header minimal (logo + lien accueil). **Header principal masqué** sur `/auth/*`. |
| **Dashboard** | `app/dashboard/layout.tsx` | **Authentification requise** : redirection vers `/auth/signin` si non connecté. Affiche `DashboardShell` (sidebar + contenu). |
| **Account** | `app/account/layout.tsx` | **Authentification requise**. Pas de sidebar spécifique, contenu seul. |
| **Admin** | `app/admin/layout.tsx` | **Rôle ADMIN requis** : redirection vers `/dashboard` sinon. Sidebar admin (`AdminSidebar`). |
| **Dashboard / Auth** | `components/header.tsx` | Le header global **ne s’affiche pas** sur les chemins `/dashboard` et `/auth`. |

---

## 3. Pages et contenu

### 3.1 Page d'accueil

| Route | Fichier | Contenu | Accès |
|-------|---------|---------|--------|
| `/` | `app/page.tsx` | Landing : Hero, Comment ça marche, Cas d’usage, Fonctionnalités, Pourquoi QuizLink, CTA final. **Si l’utilisateur est connecté** → redirection vers `/dashboard`. | Public (non connecté) |

**Sections (composants dans `components/landing/`)** :  
`HeroSection`, `HowItWorksSection`, `UseCasesSection`, `FeaturesSection`, `WhyQuizLinkSection`, `FinalCTA`.

---

### 3.2 Authentification

| Route | Fichier | Contenu | Accès |
|-------|---------|---------|--------|
| `/auth/signin` | `app/auth/signin/page.tsx` | Formulaire connexion (email, mot de passe). Lien « Mot de passe oublié », lien inscription. Panneau latéral (SigninSidePanel). | Public |
| `/auth/signup` | `app/auth/signup/page.tsx` | Formulaire inscription (nom, email, mot de passe). Panneau latéral (SignupSidePanel) avec 3 points (création quiz, partage, scores). | Public |
| `/auth/forgot-password` | `app/auth/forgot-password/page.tsx` | Saisie email pour envoi lien de réinitialisation. Succès : message + bouton « Retour à la connexion ». | Public |
| `/auth/reset-password` | `app/auth/reset-password/page.tsx` | Query `?token=...`. Validation du token puis formulaire nouveau mot de passe. États : chargement, token invalide, formulaire. | Public (avec token) |
| `/auth/verify-email` | `app/auth/verify-email/page.tsx` | Saisie du code à 6 chiffres envoyé par email après inscription. | Public |

**Interactions** :  
Signin → Signup, Forgot password. Forgot password → email → Reset password (lien avec token). Signup → Verify email → Signin.

---

### 3.3 Génération de quiz (IA)

| Route | Fichier | Contenu | Accès |
|-------|---------|---------|--------|
| `/generate` | `app/generate/page.tsx` (wrapper) | Si **non connecté** → redirection vers `/generate/preview`. Sinon affiche le contenu de génération. | Connecté (sinon → preview) |
| `/generate/preview` | `app/generate/preview/page.tsx` | Si **non connecté** → redirection vers `/auth/signin?callbackUrl=/generate/preview`. Sinon même contenu que `/generate`. | Connecté (sinon → signin) |

**Contenu (page-content)** :  
Onglets Document / Texte (coller ou taper), options de génération (modal), bouton « Générer le Quiz ». Consommation de coins pour l’IA. Après génération → redirection vers le builder ou l’aperçu du quiz.

---

### 3.4 Création manuelle de quiz (Builder)

| Route | Fichier | Contenu | Accès |
|-------|---------|---------|--------|
| `/builder` | `app/builder/page.tsx` (wrapper) | Si **non connecté** → redirection vers `/builder/preview`. Sinon liste/création de quiz. | Connecté |
| `/builder/preview` | `app/builder/preview/page.tsx` | Aperçu / démo du builder pour utilisateurs non connectés (incitation à s’inscrire). | Public |
| `/builder/[quizId]` | `app/builder/[quizId]/page.tsx` | Édition d’un quiz existant : métadonnées, questions, options, paramètres (visibilité, temps, mélange). | Connecté (propriétaire) |

**Interactions** :  
Dashboard ou CTA « Créer » → `/builder` ou `/builder/[quizId]`. Génération IA réussie → souvent vers un quiz créé (builder ou preview).

---

### 3.5 Dashboard (utilisateur connecté)

| Route | Fichier | Contenu | Accès |
|-------|---------|---------|--------|
| `/dashboard` | `app/dashboard/page.tsx` | Page d’accueil du dashboard : message de bienvenue, cartes « Mes quiz », « Participants », « Créer un quiz ». | Connecté |
| `/dashboard/quizzes` | `app/dashboard/quizzes/page.tsx` | Liste des quiz de l’utilisateur. Création, édition, suppression, duplication, partage, statistiques. | Connecté |
| `/dashboard/quiz/[quizId]` | `app/dashboard/quiz/[quizId]/page.tsx` | Détail d’un quiz : stats, participants, tentatives, liens personnalisés. | Connecté |
| `/dashboard/quiz/[quizId]/participants/[participantId]` | `app/dashboard/quiz/.../participants/[participantId]/page.tsx` | Détail d’un participant : invitations (liens), tentatives, envoi d’email avec lien personnalisé. | Connecté |
| `/dashboard/quiz/.../participants/[participantId]/report` | `.../report/page.tsx` | Rapport détaillé d’un participant (IA possible) : forces/faiblesses, export PDF. | Connecté |
| `/dashboard/participants` | `app/dashboard/participants/page.tsx` | Liste de tous les participants (tous quiz confondus). Création participant, liens par quiz. | Connecté |
| `/dashboard/participants/[participantId]` | `app/dashboard/participants/[participantId]/page.tsx` | Fiche participant : infos, quiz assignés, création de lien personnalisé par quiz. | Connecté |

**Interactions** :  
Header (si connecté) → « Tableau de bord » → `/dashboard`. Dashboard → Mes quiz → `/dashboard/quizzes` → clic quiz → `/dashboard/quiz/[quizId]`. De là → Participants / Tentatives / Liens. Participants → détail participant → rapport ou envoi lien.

---

### 3.6 Jouer à un quiz (liens publics ou personnalisés)

| Route | Fichier | Contenu | Accès |
|-------|---------|---------|--------|
| `/quiz/[token]` | `app/quiz/[token]/page.tsx` | Introduction au quiz (titre, description). Bouton « Commencer le quiz ». Gestion des liens personnalisés (invitation par nom). | Public (token dans l’URL) |
| `/quiz/[token]/play` | `app/quiz/[token]/play/page.tsx` | Passage du quiz : questions une par une, chrono optionnel, envoi des réponses. Query optionnelle `?attemptId=...` ou `?participantId=...` pour liens personnalisés. | Public (token) |
| `/quiz/[token]/results/[attemptId]` | `app/quiz/[token]/results/[attemptId]/page.tsx` | Résultats de la tentative : score, réponses correctes/incorrectes, détails. | Public (token + attemptId) |

**Interactions** :  
Partage d’un lien du type `/quiz/[token]` (ou avec query). Le participant ouvre l’intro → « Commencer » → `/quiz/[token]/play`. À la fin → redirection vers `/quiz/[token]/results/[attemptId]`. Pour un lien personnalisé, l’email contient l’URL avec `participantId` pour pré-remplir ou lier la tentative.

---

### 3.7 Compte utilisateur

| Route | Fichier | Contenu | Accès |
|-------|---------|---------|--------|
| `/account` | `app/account/page.tsx` | Paramètres du compte : profil (nom, langue), email, sécurité (mot de passe), zone danger (suppression compte). | Connecté |
| `/account/coins` | `app/account/coins/page.tsx` | Solde de coins, historique des transactions. Lien vers tarifs pour acheter. | Connecté |

**Interactions** :  
Menu utilisateur (header ou dashboard) → « Paramètres » / « Compte » → `/account`. Depuis `/account` ou besoin de coins → lien vers `/pricing`.

---

### 3.8 Tarifs et paiement

| Route | Fichier | Contenu | Accès |
|-------|---------|---------|--------|
| `/pricing` | `app/pricing/page.tsx` | Liste des packs de coins (Stripe). Achat → checkout Stripe. | Public (achat souvent après connexion) |
| `/pricing/success` | `app/pricing/success/page.tsx` | Page de succès après paiement : vérification, crédit des coins. | Après retour Stripe |

**Interactions** :  
Header « Tarifs » → `/pricing`. Clic sur un pack → Stripe Checkout. Retour Stripe → webhook + redirection possible vers `/pricing/success`.

---

### 3.9 Administration

| Route | Fichier | Contenu | Accès |
|-------|---------|---------|--------|
| `/admin` | `app/admin/page.tsx` | Dashboard admin : recherche utilisateurs, liste, gestion des coins par utilisateur. | ADMIN |
| `/admin/coins` | `app/admin/coins/page.tsx` | Gestion des coins : crédit manuel à un utilisateur (email, montant, raison). | ADMIN |
| `/admin/packs` | `app/admin/packs/page.tsx` | Gestion des packs de coins (CRUD) pour Stripe. | ADMIN |
| `/admin/feedback` | `app/admin/feedback/page.tsx` | Liste et détail des feedbacks utilisateurs (bugs, suggestions). | ADMIN |

**Interactions** :  
Header (si ADMIN) → « Admin » → `/admin`. Sidebar admin → Coins, Packs, Feedbacks.

---

### 3.10 Autres pages

| Route | Fichier | Contenu | Accès |
|-------|---------|---------|--------|
| `/legal` | `app/legal/page.tsx` | Mentions légales : éditeur, hébergeur, données personnelles (RGPD), contact. | Public |
| `/design-system` | `app/design-system/page.tsx` | Page de démo des composants UI (boutons, cartes, toasts…). Utile en dev. | Public |
| 404 | `app/not-found.tsx` | Page « Page non trouvée » avec lien retour accueil. | Quand route inexistante |

---

## 4. Interactions entre pages (schéma)

```
                    ┌─────────────┐
                    │     /      │  (accueil)
                    │  Landing   │
                    └─────┬──────┘
                          │ connecté ? → /dashboard
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
  ┌──────────────┐ ┌─────────────┐ ┌─────────────┐
  │ /auth/signin │ │ /pricing    │ │ /generate   │
  │ /auth/signup │ │             │ │ /builder    │
  └──────┬───────┘ └──────┬──────┘ └──────┬──────┘
         │                │                │
         │  signup → verify-email          │ non connecté
         │  signin ←──────────────────────┘  → signin ou preview
         │  forgot → reset (token)
         │
         ▼
  ┌──────────────────────────────────────────┐
  │              /dashboard                   │
  │  welcome → quizzes / participants        │
  └──────┬───────────────────┬────────────────┘
         │                   │
         ▼                   ▼
  /dashboard/quizzes   /dashboard/participants
  /dashboard/quiz/[id]  /dashboard/participants/[id]
         │                   │
         │  partage lien     │  créer lien personnalisé
         │  /quiz/[token]    │  → email → /quiz/[token]
         ▼                   ▼
  ┌──────────────────────────────────────────┐
  │           /quiz/[token]                   │
  │  intro → /quiz/[token]/play               │
  │       → /quiz/[token]/results/[attemptId] │
  └──────────────────────────────────────────┘

  Compte : Header/UserMenu → /account, /account/coins
  Admin  : Header (si ADMIN) → /admin → coins, packs, feedback
```

---

## 5. Résumé des redirections et contrôles d’accès

| Contexte | Comportement |
|----------|--------------|
| Non connecté sur `/dashboard`, `/account`, `/admin` | Redirection vers `/auth/signin` (ou `/dashboard` pour admin non ADMIN). |
| Connecté sur `/` | Redirection vers `/dashboard`. |
| Non connecté sur `/generate` | Redirection vers `/generate/preview`. |
| Non connecté sur `/generate/preview` | Redirection vers `/auth/signin?callbackUrl=/generate/preview`. |
| Non connecté sur `/builder` | Redirection vers `/builder/preview`. |
| Rôle non ADMIN sur `/admin` | Redirection vers `/dashboard`. |
| Token reset password invalide ou expiré | Message d’erreur + lien vers `/auth/forgot-password`. |
| Token quiz invalide sur `/quiz/[token]` | Message « Quiz non trouvé » ou équivalent. |
| Lien personnalisé avec `participantId` incorrect | Message « Ce lien ne t'appartient pas » (ou accès non autorisé). |

---

## 6. APIs et actions serveur

- **`/api/auth/[...nextauth]`** : NextAuth (connexion, session, JWT).
- **`/api/stripe/checkout`** : Création de session Stripe pour l’achat de coins.
- **`/api/stripe/webhook`** : Webhook Stripe (paiement réussi → crédit coins).
- **`/api/coin-packs`** et **`/api/admin/coin-packs`** : Lecture / gestion des packs (côté admin).

Les **Server Actions** (fichiers `actions.ts`) gèrent : auth (signin, signup, verify-email, reset password), génération IA, builder (CRUD quiz), dashboard (participants, liens, tentatives), rapports, envoi d’emails (invitation, reset, vérification), Stripe et coins.

Ce document peut être mis à jour au fil de l’évolution des routes et des parcours utilisateur.
