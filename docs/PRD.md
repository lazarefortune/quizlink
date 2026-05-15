# PRD — QuizLink

> **Note :** Ce document décrit la vision produit initiale. Certains éléments ont évolué depuis (ex : Stripe est intégré, les quiz n’ont pas de lien expirant en 24h par défaut). Pour l’état actuel de l’app, voir [STRUCTURE-APP.md](STRUCTURE-APP.md) et [ARCHITECTURE.md](ARCHITECTURE.md).

---

QuizLink permet de générer automatiquement des quiz à partir de ressources (texte, PDF, audio…) et de les partager via un lien temporaire (24h).
Pour conserver, modifier ou réutiliser les quiz, l’utilisateur crée un compte.

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

Sans compte obligatoire

Conversion naturelle via l’expiration du lien

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

prolonger le lien

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

7️⃣ Règles métiers importantes

Un quiz sans owner expire toujours

L’expiration est automatique et irréversible

Un quiz expiré :

n’est plus accessible

propose la création de compte

Un quiz avec owner :

peut être dupliqué

peut avoir un lien permanent

8️⃣ UX / Parcours utilisateur
🟢 Parcours idéal

Landing page → “Créer un quiz”

Upload texte / PDF

Choix du nombre de questions

Génération (loader + feedback)

Quiz prêt → lien partagé

Message clair : “Expire dans 24h”

CTA : “Créer un compte pour conserver”

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

Expiration

Auth

Sauvegarde
