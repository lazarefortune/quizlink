# Génération de rapports pour les quizzes

Ce document décrit le fonctionnement de la génération de rapports IA pour les participants à un quiz.

## Vue d’ensemble

Un **rapport participant** est un document d’analyse pédagogique généré par IA à partir des tentatives d’un participant sur un quiz donné. Il fournit : résumé, forces/faiblesses, erreurs récurrentes, questions à revoir, plan d’étude sur 7 jours, conseils et points d’attention.

---

## Où ça se passe

- **Page** : `/dashboard/quiz/[quizId]/participants/[participantId]/report`
- **Server action** : `app/(app)/dashboard/quiz/[quizId]/participants/[participantId]/report/actions.ts`
- **Agrégation des données** : `lib/analytics/quiz-participant-aggregator.ts`
- **Génération IA** : `lib/ai/participant-report-generator.ts`
- **Schéma de sortie** : `lib/ai/participant-report-schema.ts`
- **Export PDF** : `lib/ai/participant-report-pdf.ts` (côté client, jsPDF)

---

## Flux de génération

1. **Contrôles d’accès**
   - Utilisateur authentifié.
   - Quiz existant et appartenant à l’utilisateur (`quiz.ownerId === session.user.id`).
   - Participant lié au quiz via un `QuizLink` avec **au moins une tentative** (`QuizAttempt`).

2. **Coins**
   - Chaque rapport coûte **4 coins** (`COINS_PER_REPORT = 4`).
   - Vérification du solde avant génération ; les **ADMIN** peuvent ignorer la limite (déduction avec `allowNegativeBalance`).
   - Les coins sont déduits **uniquement après** une génération réussie.

3. **Construction du payload**
   - `buildQuizParticipantReportPayload(quizId, participantId)` dans `quiz-participant-aggregator.ts` :
     - Charge quiz, participant, lien quiz–participant, puis toutes les tentatives avec réponses et questions.
     - Ne renvoie **pas** les bonnes réponses brutes ; uniquement des **statistiques et libellés courts** (tronqués à 120 caractères).
   - Le payload contient notamment :
     - Infos quiz (id, nom, nombre de questions, extrait des settings).
     - Infos participant (id, nom).
     - **Totaux** : nombre de tentatives, réponses, bonnes réponses, taux de réussite, temps moyen par question, date dernière tentative, **tendance** (précision et temps moyen par tentative).
     - **Par type de question** : MULTIPLE_CHOICE, TRUE_FALSE, CHECKBOX (dont patterns checkbox : options correctes manquées / options incorrectes en trop).
     - **Questions les plus ratées** : id, libellé court, type, fois vues/ratées, taux d’erreur, libellés des bonnes options, principales mauvaises options choisies (cap à 10 questions).
     - **Signaux de temps** : questions trop rapides (< 3 s) et trop lentes (> 30 s) avec temps moyen et taux d’erreur.
     - **Exemples** : jusqu’à 3 exemples de réponses incorrectes (question, type, réponses choisies vs correctes, numéro de tentative).
     - **Contraintes** : langue `"fr"`, longueur `"medium"`, focus (forces, faiblesses, questions récurrentes, pourquoi, plan d’étude).

4. **Appel IA**
   - `generateParticipantReportFromPayload(payload)` dans `participant-report-generator.ts` :
     - Modèle : **gpt-4o-mini**.
     - Prompt système : rôle « analyste pédagogique », consignes pour produire un JSON avec des clés précises (summary, strengths, weaknesses, recurringMistakes, mostImportantQuestionsToReview, studyPlan7Days, tips, warnings).
     - Réponse attendue : objet JSON à la racine (sans wrapper, sans markdown).
     - La réponse est normalisée (alias français/anglais, extraction si le modèle renvoie un wrapper) puis validée avec **Zod** (`participantReportOutputSchema`).

5. **Structure du rapport (sortie Zod)**
   - `summary` : `overallLevel` (beginner | intermediate | advanced), `oneSentence`, `keyNumbers[]`.
   - `strengths` / `weaknesses` : tableaux de `{ title, evidence, metric }`.
   - `recurringMistakes` : `{ pattern, whyLikely, howToFix }`.
   - `mostImportantQuestionsToReview` : `{ question, whyMissed, whatToRemember }`.
   - `studyPlan7Days` : `{ day (1–7), focus, tasks[] }`.
   - `tips[]`, `warnings[]`.

6. **Après succès**
   - Déduction des 4 coins.
   - Revalidation des paths dashboard, page rapport, compte coins.
   - Le rapport est renvoyé au client et affiché dans `ParticipantReportContent` (sections repliables, etc.).

---

## Export et envoi par email

- **PDF** : généré côté client avec **jsPDF** à partir de `ParticipantReportOutput` (`buildReportPdfBlob` dans `participant-report-pdf.ts`). Utilisé pour le téléchargement et pour l’envoi par email (PDF en base64).
- **Email** : `sendReportByEmailAction(quizId, participantId, recipientEmail, pdfBase64, locale)` vérifie auth et propriété du quiz, valide l’email, puis envoie l’email avec le PDF en pièce jointe (sujet/corps selon la locale).

---

## Récap des fichiers clés

| Rôle | Fichier |
|------|--------|
| Page + droits | `app/(app)/dashboard/quiz/[quizId]/participants/[participantId]/report/page.tsx` |
| Génération + envoi email | `app/.../report/actions.ts` |
| UI rapport | `app/.../report/report-content.tsx` |
| Payload agrégé | `lib/analytics/quiz-participant-aggregator.ts` |
| IA + normalisation | `lib/ai/participant-report-generator.ts` |
| Schéma sortie | `lib/ai/participant-report-schema.ts` |
| PDF (client) | `lib/ai/participant-report-pdf.ts` |

---

## Sécurité et confidentialité

- Aucune donnée sensible n’est exposée côté client au-delà de ce qui est nécessaire pour l’affichage du rapport.
- Le payload envoyé à l’IA ne contient pas les réponses correctes complètes, seulement des statistiques et des libellés tronqués.
- Propriété du quiz et existence du lien participant–quiz avec tentatives sont vérifiées côté serveur avant toute génération ou envoi d’email.
