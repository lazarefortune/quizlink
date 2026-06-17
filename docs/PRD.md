# PRD — QuizLink

> **Note :** Ce document mélange la vision produit initiale et l’état actuel. Pour le modèle business en vigueur (quota, déblocage, Pro, purge), voir [quiz-quota-model.md](quiz-quota-model.md). Pour l’architecture technique, voir [STRUCTURE-APP.md](STRUCTURE-APP.md) et [ARCHITECTURE.md](ARCHITECTURE.md).

---

QuizLink permet de générer automatiquement des quiz à partir de ressources (texte, PDF, audio…) et de les partager via un lien.

**Message central actuel :**

```txt
Crée ton quiz gratuitement.
Reçois tes 20 premières réponses.
Débloque le quiz quand tu veux aller plus loin.
```

Pour conserver, analyser en profondeur ou dépasser la limite gratuite, l’utilisateur crée un compte et peut débloquer un quiz avec des coins ou souscrire à QuizLink Pro.

1️⃣ Vision produit
🎯 Problème

Créer un quiz à partir de contenu est long, pénible et peu intuitif

Les outils existants sont souvent :

trop complexes

trop orientés “éducation institutionnelle”

ou verrouillés derrière un compte dès le départ

💡 Solution

Une app ultra simple

Input → Quiz → Lien partageable

Sans friction à la création

Conversion naturelle via la limite gratuite de réponses et le déblocage

2️⃣ Cible / Personas
🎓 Étudiants

Réviser rapidement à partir de cours PDF

Partager un quiz à un pote

👨‍🏫 Formateurs / créateurs

Transformer contenu en quiz pour leur audience

Tester la compréhension

🧑‍💻 Pro / RH

Évaluer rapidement après une doc ou une formation

Partage interne rapide

3️⃣ Périmètre fonctionnel

> Les sections MVP ci-dessous décrivent la V1 initiale (lien 24h). Le modèle actuel est le quota — voir section 7 et [quiz-quota-model.md](quiz-quota-model.md).

🔹 MVP (V1 – priorité absolue)
A. Génération de quiz

Input supportés :

Texte libre

PDF

Génération automatique :

QCM

Vrai / Faux

Nombre de questions configurable (ex: 5 / 10 / 15)

B. Quiz public via lien

Génération d’un lien unique

Lien expire automatiquement après 24h

Quiz accessible sans compte

Résultat affiché à la fin

C. Conversion compte

Si l’utilisateur veut :

débloquer un quiz au-delà de la limite gratuite

consulter toutes les parties détaillées et les stats avancées

modifier le quiz

sauvegarder

👉 création de compte obligatoire

🔹 V1.5 (rapide après MVP)

Édition manuelle des questions

Duplication de quiz

Historique utilisateur

Lien non expirant (compte)

🔹 V2 (hors MVP)

Audio → transcription → quiz

Vidéo YouTube → quiz

Analytics (score moyen, taux de réussite)

Export PDF

Mode “classe / groupe”

4️⃣ User Stories (MVP)
🧑‍💻 Utilisateur anonyme

En tant qu’utilisateur, je peux coller un texte ou importer un PDF

En tant qu’utilisateur, je peux générer un quiz automatiquement

En tant qu’utilisateur, je peux partager un lien valide 24h

En tant qu’utilisateur, je peux répondre au quiz sans créer de compte

👤 Utilisateur connecté

En tant qu’utilisateur, je peux créer un compte

En tant qu’utilisateur, je peux sauvegarder mes quiz

En tant qu’utilisateur, je peux modifier les questions

En tant qu’utilisateur, je peux générer un lien permanent

5️⃣ Contraintes techniques
🧱 Stack imposée

Next.js (App Router)

TypeScript

TailwindCSS

shadcn/ui

Auth maison ou NextAuth (à décider)

API routes internes (/app/api)

🧠 IA

Génération quiz via LLM

Prompt structuré (questions pertinentes, pas génériques)

Output strictement typé (JSON)

6️⃣ Modèle de données (simplifié)
User

id

email

passwordHash

createdAt

Quiz

id

title

sourceType (TEXT | PDF)

expiresAt (nullable)

ownerId (nullable)

createdAt

Question

id

quizId

type (MCQ | TRUE_FALSE)

question

choices[]

correctAnswer

7️⃣ Règles métiers QuizLink (modèle quota actuel)

Une réponse gratuite correspond à une partie terminée (`COMPLETED`).

Les parties abandonnées (`ABANDONED`) ne comptent pas dans la limite gratuite.

Un quiz gratuit accepte jusqu’à 20 réponses terminées.

À 20 réponses, le quiz ne reçoit plus de nouvelles réponses tant qu’il n’est pas débloqué.

Débloquer un quiz avec 40 coins est définitif : toutes les parties détaillées et les stats avancées restent accessibles.

Pro débloque tous les quiz tant que l’abonnement est actif.

Quand Pro expire, les quiz non débloqués reviennent au plan gratuit.

Les quiz débloqués avec coins restent débloqués même après la fin de Pro.

### Free

- créer des quiz
- recevoir jusqu’à 20 réponses terminées par quiz
- consulter les stats simples
- voir 3 parties détaillées

### Déblocage avec coins (40 coins)

- déblocage définitif du quiz
- continuer à recevoir des réponses
- voir toutes les parties détaillées
- accéder aux stats avancées

### Pro

- débloque tous les quiz tant que l’abonnement est actif
- inclut les avantages de déblocage sur tous les quiz
- les quiz débloqués avec coins restent débloqués

### Purge interne (conservation des données)

Les statistiques globales restent disponibles grâce aux agrégats. Pour maîtriser le stockage et protéger les données personnelles, les réponses détaillées des quiz gratuits inactifs peuvent être nettoyées après une période de conservation.

La purge :

- ne supprime pas le quiz
- ne supprime pas les stats globales
- ne supprime pas les agrégats
- peut supprimer les réponses détaillées et les informations participant
- ne concerne pas les quiz Pro ou débloqués

### `QuizLink.expiresAt`

`QuizLink.expiresAt` concerne l’expiration technique d’un lien d’invitation ou d’accès participant. Ce champ est séparé du modèle business quota.

---

7️⃣-bis Règles métiers historiques (MVP initial, obsolètes)

> Conservé pour contexte. Ne plus utiliser pour le produit actuel.

Un quiz sans owner expire toujours (lien 24h — remplacé par le modèle quota)

L’expiration automatique du lien comme levier de conversion (remplacée par la limite de 20 réponses)

8️⃣ UX / Parcours utilisateur
🟢 Parcours idéal

Landing page → “Créer un quiz”

Upload texte / PDF

Choix du nombre de questions

Génération (loader + feedback)

Quiz prêt → lien partagé

Message clair : « 20 réponses gratuites — débloque pour continuer »

CTA : « Créer un compte pour débloquer et analyser »

9️⃣ KPIs à suivre

Taux de génération quiz réussie

% utilisateurs qui cliquent sur “Créer un compte”

Temps moyen pour créer un quiz

Nombre de quiz créés / jour

🔟 Hors périmètre MVP (important)

❌ Paiement
❌ Multi-langue
❌ Collaboration temps réel
❌ Analytics avancés

🔧 Recommandation pour Cursor (très important)

👉 Ordre de développement conseillé :

Design System (/design-system)

Génération quiz (mock IA au début)

Quiz public via lien

Limite gratuite et déblocage

Auth

Sauvegarde
