# Modèle QuizLink (quota)

Documentation interne du modèle business actuel pour les quiz et leurs réponses.

Voir aussi : [PRD.md](PRD.md) (règles métier produit), [ROADMAP_MARKETING.md](ROADMAP_MARKETING.md) (positionnement et parcours).

## Free

- 20 réponses terminées gratuites par quiz
- Seules les parties `COMPLETED` comptent
- Les parties `ABANDONED` ne comptent pas
- Stats simples visibles
- 3 parties détaillées visibles

## Déblocage avec coins

- 40 coins
- Déblocage définitif du quiz
- Toutes les parties visibles
- Stats avancées visibles
- `QuizUnlock.expiresAt = null` signifie permanent

## Pro

- Débloque tous les quiz tant que l'abonnement est actif
- Si Pro expire, les quiz non débloqués retombent au gratuit
- Les quiz débloqués avec coins restent débloqués

## Purge interne

- Mécanisme technique de maîtrise BDD
- Ne supprime pas les quiz
- Ne supprime pas les `QuizAttempt`
- Ne supprime pas les agrégats
- Supprime uniquement les réponses détaillées et informations participant
- Ne s'applique pas aux quiz Pro ou débloqués

## Champs conservés

| Champ | Rôle |
| --- | --- |
| `responsesStartedAt` | Première activité / première réponse |
| `lastResponseAt` | Dernière activité, utile pour la purge |
| `detailsPurgedAt` | Marqueur de purge |
| `QuizLink.expiresAt` | Expiration du lien d'invitation (voir ci-dessous) |

## `QuizLink.expiresAt`

`QuizLink.expiresAt` is still used as invitation link expiration and is separate from the quota business model.

Lecture actuelle :

- **Accès joueur** : `app/quiz-link/actions.ts`, `anonymous-attempt-actions.ts`, `anonymous-quiz-actions.ts`, `anonymous-quiz-stats-actions.ts` — bloque l'accès si la date est passée
- **Portail participant** : `participant-details-content.tsx`, `actions.ts`, `lib/participant-portal.ts` — affichage et configuration de l'expiration du lien personnalisé
- **Portail public** : `app/(p)/p/[participantToken]/page.tsx` — marque les quiz expirés côté participant

Ce champ ne doit pas être confondu avec le quota gratuit (20 réponses) ni avec le déblocage coins/Pro.
