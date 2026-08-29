# Roadmap d’implémentation — Participants, réponses, preview et monétisation QuizLink

> **État actuel :** le modèle quota est implémenté. Voir [quiz-quota-model.md](quiz-quota-model.md) pour les règles métier définitives. Les phases ci-dessous conservent l’historique de conception ; les sections marquées « obsolète » ou réécrites reflètent l’ancien modèle (campagne 7 jours, expiration de lien, déblocage temporaire).

## Objectif produit

Construire une version évolutive de QuizLink où :

- la création et le partage d’un quiz restent simples ;
- les créateurs peuvent recevoir des réponses sans configuration complexe ;
- les tests faits par le créateur ne polluent pas les statistiques ;
- les réponses détaillées deviennent un levier de monétisation ;
- la BDD reste maîtrisée grâce à une stratégie de conservation ;
- le système reste compatible avec une future page “Mes quiz joués”.

Positionnement recommandé :

```txt
Crée ton quiz gratuitement.
Reçois tes 20 premières réponses.
Débloque le quiz quand tu veux aller plus loin.
```

En détail :

> Créer et partager reste gratuit.
> Les statistiques globales restent gratuites.
> Jusqu’à 20 réponses terminées par quiz, avec 3 parties détaillées visibles.
> Les coins (40) servent à débloquer un quiz définitivement.
> Pro débloque tous les quiz tant que l’abonnement est actif.

---

## Décisions produit validées

### Création et partage

- La création d’un quiz reste gratuite.
- Le partage par lien reste gratuit.
- Le créateur peut prévisualiser et tester son quiz sans polluer les statistiques.

### Réponses

- Les réponses anonymes détaillées sont enregistrées par défaut.
- “Anonyme” signifie : le créateur ne voit pas l’identité du joueur.
- Même en mode anonyme, les réponses peuvent être stockées pour produire des statistiques et créer un levier de monétisation.

### Participants

Modes de participation à prévoir progressivement :

1. Réponses anonymes
2. Nom
3. Nom + email
4. Joueur connecté à un compte QuizLink (plus tard)

En V1, l’email participant est déclaratif et non vérifié.

### Monétisation

- Ne pas commencer par un abonnement obligatoire.
- Utiliser les coins pour les actions avancées.
- Stripe sert à acheter des packs de coins.
- Le premier paywall doit viser les réponses détaillées, pas la création.

### Conservation des données

- Les statistiques globales restent disponibles grâce aux agrégats.
- Pour maîtriser le stockage et protéger les données personnelles, les réponses détaillées des quiz gratuits inactifs peuvent être nettoyées après une période de conservation (purge interne).
- La purge ne supprime pas le quiz, ni les stats globales, ni les agrégats ; elle peut supprimer les réponses détaillées et les informations participant.
- Elle ne concerne pas les quiz Pro ou débloqués avec coins.
- `QuizLink.expiresAt` concerne l’expiration technique d’un lien d’invitation participant — séparé du modèle quota.

---

# Phase 0 — Mode preview propre, non comptabilisé

## Objectif

Permettre au créateur de tester son quiz sans créer de vraie tentative et sans polluer les statistiques.

Aujourd’hui, les créateurs testent souvent leur quiz avant de l’envoyer. Si ces tests sont comptés comme de vraies réponses, les statistiques deviennent fausses.

## Règle produit

Un mode preview doit :

- permettre de jouer le quiz comme un participant ;
- ne pas créer de réponse réelle ;
- ne pas incrémenter les statistiques ;
- ne pas compter dans les ouvertures, commencés, terminés ;
- ne pas apparaître dans les réponses détaillées ;
- ne pas compter dans le quota gratuit de réponses ;

## UX recommandée

Depuis la page détail ou builder :

- bouton : `Prévisualiser`
- page ou URL dédiée : `/dashboard/quiz/{quizId}/preview`
- bandeau visible :

```txt
Mode preview — tes réponses ne seront pas enregistrées.
```

Sur la page de succès après création :

- bouton principal : `Jouer le quiz` pour ouvrir le vrai lien partageable ;
- bouton secondaire : `Prévisualiser` pour tester sans stats.

À clarifier dans l’interface :

```txt
Utilise la preview pour tester ton quiz avant de le partager.
```

## Implémentation recommandée

- Ajouter un mode de jeu `preview` côté client.
- Réutiliser le renderer de quiz existant autant que possible.
- Ne pas appeler les actions serveur de création de tentative.
- Ne pas appeler les actions serveur de soumission de réponse.
- Calculer le score localement uniquement pour l’aperçu.
- Afficher les résultats localement, sans persistance.

## Points techniques

À vérifier :

- si la preview actuelle crée déjà un lien ou une tentative ;
- si `createOrGetQuizLink` est appelé en preview ;
- si `/quiz/{token}` est utilisé pour preview ;
- si les stats anonymes sont incrémentées à l’ouverture.

Décision recommandée :

```txt
La preview ne doit pas passer par le lien public /quiz/{token}.
```

Elle doit utiliser les données du quiz côté propriétaire.

## Tests manuels

- Prévisualiser un quiz et répondre à toutes les questions.
- Vérifier que le nombre de réponses reste inchangé.
- Vérifier que les ouvertures ne changent pas.
- Vérifier que les stats anonymes ne changent pas.
- Vérifier que le score preview s’affiche bien localement.
- Vérifier qu’un utilisateur non propriétaire ne peut pas accéder à cette preview.

---

# Phase 1 — Modèle de participation et tentatives

## Objectif

Enregistrer les réponses aux quiz de manière propre, sobre et évolutive.

> **Note :** les champs `detailsVisibleUntil`, `detailsPurgeAt`, `detailsUnlockedUntil` et les dates de campagne sur `QuizLink` ont été supprimés. Le modèle actuel repose sur le quota (20 réponses terminées) et la purge interne (`detailsPurgedAt`, `lastResponseAt`).

## Modèle recommandé

### QuizAttempt

Représente une tentative de participation à un quiz.

Champs recommandés :

```txt
id
quizId
quizLinkId
userId nullable
participantName nullable
participantEmail nullable
identityMode
status
score
totalQuestions
startedAt
completedAt
durationSeconds
detailsVisibleUntil
detailsPurgeAt
detailsPurgedAt nullable
detailsUnlockedUntil nullable
createdAt
updatedAt
```

`identityMode` :

```txt
ANONYMOUS
PSEUDO
NAME_EMAIL
CONNECTED_USER
```

`status` :

```txt
STARTED
COMPLETED
ABANDONED
EXPIRED
```

### QuizAttemptAnswer

Représente une réponse à une question.

Champs recommandés :

```txt
id
attemptId
questionId
selectedOptionIds Json
isCorrect
timeSpentSeconds nullable
answeredAt
createdAt
```

## Décision BDD

Ne pas stocker de snapshot lourd en V1.

On ne stocke pas dans chaque réponse :

- texte complet de la question ;
- texte complet des options ;
- explications complètes.

Raison :

- BDD plus légère ;
- modèle plus simple ;
- cohérent avec la règle actuelle qui empêche de modifier un quiz avec réponses sans copie/reset.

## À faire

- Créer les tables Prisma.
- Brancher le démarrage d’une tentative quand un vrai joueur commence un quiz.
- Enregistrer les réponses question par question ou à la soumission finale selon le flow actuel.
- Stocker score, total, durée et statut.
- Exclure explicitement le mode preview.

## Tests manuels

- Jouer un quiz public réel.
- Vérifier qu’une tentative est créée.
- Vérifier que les réponses sont enregistrées.
- Vérifier que le score est stocké.
- Vérifier qu’une preview ne crée rien.

---

# Phase 2 — Stats globales gratuites

## Objectif

Permettre au créateur de voir gratuitement que son quiz reçoit des réponses, sans forcément accéder au détail complet.

## Stats gratuites recommandées

À afficher gratuitement :

```txt
Nombre d’ouvertures
Nombre de commencés
Nombre de terminés
Taux de complétion
Score moyen
Meilleur score
Score le plus faible
Nombre de réponses
Questions les plus réussies
Questions les plus difficiles
```

## UX recommandée

Sur la page détail du quiz :

```txt
Ton quiz a reçu 12 réponses 🎉

Score moyen : 72 %
Taux de complétion : 84 %
Question la plus difficile : Question 4
```

## Important

Ces stats ne doivent jamais inclure :

- les previews du créateur ;
- les tests internes ;
- les tentatives incomplètes si elles ne doivent pas compter dans le score moyen.

## Tests manuels

- Faire 3 vraies réponses.
- Faire 2 previews.
- Vérifier que les stats ne comptent que les 3 vraies réponses.

---

# Phase 3 — Accès aux réponses détaillées (modèle quota)

## Objectif

Créer un levier de valeur tout en gardant une expérience gratuite utile.

## Règle actuelle (implémentée)

Pour un quiz gratuit :

```txt
Jusqu’à 20 réponses terminées reçues.
3 parties détaillées visibles gratuitement.
Stats simples toujours visibles.
Au-delà : parties masquées, limite atteinte pour les nouvelles réponses.
```

Les parties `ABANDONED` ne comptent pas dans la limite gratuite.

## Détails visibles gratuitement

Le créateur peut voir gratuitement :

```txt
stats globales (score moyen, taux de complétion, etc.)
3 parties détaillées (score, réponses question par question, durée)
```

## Au-delà de la limite gratuite

Masquer les parties au-delà des 3 premières, et bloquer les nouvelles réponses à 20 parties terminées.

UX possible :

```txt
Limite gratuite atteinte.
Débloque ce quiz pour continuer à recevoir des réponses et voir toutes les parties détaillées.
```

## Purge interne (quiz gratuits inactifs)

Les statistiques globales restent disponibles grâce aux agrégats. Pour maîtriser le stockage et protéger les données personnelles, les réponses détaillées des quiz gratuits inactifs peuvent être nettoyées après une période de conservation.

Si le quiz n’est pas débloqué ni couvert par Pro :

- supprimer les `QuizAttemptAnswer` ;
- anonymiser ou supprimer `participantName` ;
- anonymiser ou supprimer `participantEmail` ;
- conserver `QuizAttempt` avec score, date, durée, statut ;
- conserver les agrégats de stats globales.

## Tests manuels

- Créer 3 réponses terminées : vérifier l’accès détaillé gratuit.
- Créer une 4e réponse : vérifier le masquage des parties au-delà de 3.
- Atteindre 20 réponses : vérifier que le quiz n’accepte plus de nouvelles réponses.
- Débloquer avec 40 coins : vérifier l’accès à toutes les parties et les stats avancées.
- Simuler une purge : vérifier que les stats globales restent visibles.

---

# Phase 4 — Déblocage avec coins

## Objectif

Utiliser le système de coins pour débloquer définitivement un quiz.

## Décision actuelle (implémentée)

```txt
Débloquer un quiz : 40 coins — déblocage définitif.
```

Le déblocage inclut :

```txt
continuer à recevoir des réponses sans limite
toutes les parties détaillées visibles
stats avancées
export CSV plus tard
```

## Modèle

Table `QuizUnlock` :

```txt
id
quizId
userId
type
source
coinsSpent
startsAt
expiresAt (null = permanent pour un déblocage coins)
createdAt
updatedAt
```

## Effet du déblocage

Quand un quiz est débloqué avec des coins :

```txt
QuizUnlock.expiresAt = null (permanent)
```

Toutes les parties détaillées et les stats avancées restent accessibles.

## UX recommandée

Si l’utilisateur a assez de coins :

```txt
Débloquer ce quiz — 40 coins
```

Si l’utilisateur n’a pas assez de coins :

```txt
Il te manque 25 coins pour débloquer ce quiz.
Acheter des coins
```

Après déblocage :

```txt
Quiz débloqué.
```

## Tests manuels

- Débloquer un quiz avec assez de coins.
- Vérifier que les coins sont décrémentés une seule fois.
- Vérifier que toutes les parties détaillées sont visibles.
- Vérifier l’accès aux stats avancées.
- Tester le cas coins insuffisants.

---

# Phase 5 — Limite gratuite de réponses (quota)

> Remplace l’ancienne « Phase 5 — Expiration des liens de quiz » (obsolète).

## Objectif

Limiter la réception de réponses sur les quiz gratuits tout en créant un levier de monétisation clair.

## Règle actuelle (implémentée)

Pour les quiz gratuits :

```txt
Jusqu’à 20 réponses terminées par quiz.
À 20 réponses : le quiz n’accepte plus de nouvelles réponses tant qu’il n’est pas débloqué.
```

Seules les parties `COMPLETED` comptent. Les parties `ABANDONED` ne comptent pas.

Pour un quiz débloqué (coins ou Pro) :

```txt
Réception de réponses illimitée.
```

## UX côté créateur

```txt
12 / 20 réponses gratuites utilisées.
```

Si limite atteinte :

```txt
Limite gratuite atteinte.
Débloque ce quiz pour continuer à recevoir des réponses.
```

## UX côté joueur

Si un joueur tente de jouer un quiz dont la limite est atteinte :

```txt
Ce quiz n’accepte plus de nouvelles réponses pour le moment.
Demande au créateur de le débloquer.
```

## Monétisation

```txt
Débloquer ce quiz : 40 coins (définitif).
Ou QuizLink Pro : tous les quiz débloqués tant que l’abonnement est actif.
```

## Note sur `QuizLink.expiresAt`

`QuizLink.expiresAt` concerne l’expiration technique d’un lien d’invitation participant. Ce champ est séparé du modèle business quota et ne doit pas être confondu avec la limite de 20 réponses.

## Tests manuels

- Recevoir des réponses jusqu’à 20 parties terminées.
- Vérifier le blocage des nouvelles réponses.
- Débloquer le quiz avec 40 coins.
- Vérifier que le quiz accepte à nouveau des réponses.
- Vérifier le comportement avec Pro actif.

---

# Phase 6 — Modes de participation

## Objectif

Permettre au créateur de choisir le niveau d’identification des joueurs.

## Modes proposés

### 1. Réponses anonymes

```txt
Les joueurs n’ont rien à remplir. Tu verras les résultats sans leur identité.
```

### 2. Nom ou pseudo

```txt
Les joueurs indiquent un nom ou pseudo avant de commencer.
```

### 3. Nom + email

```txt
Les joueurs indiquent leur nom et leur email avant de commencer.
```

## Où proposer ce choix ?

Ne pas le cacher uniquement dans les paramètres.

Le proposer après création, sur la page succès :

```txt
Avant de partager, veux-tu savoir qui répond ?
```

Options :

```txt
Réponses anonymes
Demander un nom ou pseudo
Demander nom + email
```

## RGPD / transparence

Si réponses anonymes :

```txt
Tes réponses seront envoyées anonymement au créateur du quiz.
```

Si nom/pseudo :

```txt
Ton nom ou pseudo et tes réponses seront visibles par le créateur du quiz.
```

Si nom + email :

```txt
Ton nom, ton email et tes réponses seront visibles par le créateur du quiz.
```

## Email participant

En V1 :

```txt
Email collecté = déclaratif.
Pas de vérification email obligatoire pour jouer.
```

## Tests manuels

- Mode anonyme : jouer sans formulaire.
- Mode pseudo : formulaire pseudo obligatoire.
- Mode nom/email : formulaire nom + email obligatoire.
- Vérifier les mentions d’information.
- Vérifier que les infos apparaissent côté créateur uniquement si le mode le permet.

---

# Phase 7 — Page réponses détaillées

## Objectif

Afficher les réponses exploitables côté créateur.

## Vue recommandée

Onglet ou section `Réponses` sur la page détail du quiz.

### Liste des tentatives

Colonnes :

```txt
Participant
Score
Durée
Date
Statut
Détails
```

### Détail d’une tentative

Afficher :

```txt
Question
Réponse donnée
Correct / incorrect
Temps passé
Explication si disponible
```

## Paywall

Si le quiz n’est pas débloqué et que la limite gratuite est atteinte ou que les parties sont masquées :

```txt
Limite gratuite atteinte.
Débloque ce quiz avec 40 coins pour continuer à recevoir des réponses et voir toutes les parties détaillées.
```

## Tests manuels

- Voir les 3 premières parties détaillées gratuitement.
- Voir une partie masquée au-delà de la limite d’aperçu.
- Débloquer le quiz.
- Voir toutes les tentatives détaillées et les stats avancées.

---

# Phase 8 — Espace “Mes quiz joués”

## Objectif long terme

Permettre à un utilisateur connecté de retrouver les quiz auxquels il a participé.

## Règle

Quand un utilisateur connecté joue un quiz :

```txt
QuizAttempt.userId = session.user.id
```

Même si le quiz est en mode anonyme, son identité ne doit pas forcément être visible au créateur.

Côté créateur :

```txt
Participant anonyme #12
```

Côté joueur connecté :

```txt
Mes quiz joués
```

## UX joueur

Après le résultat :

```txt
Ce quiz est enregistré dans “Mes quiz joués”.
```

Si le joueur n’est pas connecté :

```txt
Crée un compte pour retrouver ce quiz et tes réponses plus tard.
```

## Tests manuels

- Joueur connecté joue un quiz d’un autre utilisateur.
- Le quiz apparaît dans “Mes quiz joués”.
- Le créateur ne voit pas l’identité si le mode est anonyme.
- Joueur joue son propre quiz : la tentative apparaît aussi dans “Mes quiz joués”.

---

# Phase 9 — Packs de coins avec Stripe

## Objectif

Permettre l’achat de coins via Stripe.

## Packs recommandés

```txt
50 coins  = 4,90 €
120 coins = 9,90 €
300 coins = 19,90 €
```

## Utilisation des coins

```txt
Générer un quiz avec l’IA
Débloquer un quiz définitivement (40 coins)
Rapport IA par participant
Exporter les résultats plus tard
```

## UX

Sur écran d’achat :

```txt
Les coins servent à utiliser les fonctionnalités avancées de QuizLink.
```

Sur paywall :

```txt
Débloquer ce quiz : 40 coins
```

## Tests manuels

- Acheter un pack de coins.
- Vérifier webhook Stripe.
- Vérifier crédit des coins une seule fois.
- Tester un paiement échoué.
- Tester un webhook répété.

---

# Phase 10 — Admin, nettoyage et monitoring

## Objectif

Garder le système contrôlable et éviter la surcharge BDD.

## À prévoir

### Job de nettoyage (purge interne)

Règles :

```txt
Si quiz gratuit inactif (quota + inactivité)
et quiz non débloqué
et non couvert par Pro
et detailsPurgedAt est null
alors supprimer/anonymiser les détails.
```

Les statistiques globales et les agrégats sont conservés.

### Logs / monitoring

Suivre :

```txt
nombre de tentatives créées
nombre de réponses détaillées stockées
nombre de détails purgés
nombre de quiz débloqués
quiz ayant atteint la limite gratuite
coins dépensés
conversion paywall
```

### Admin

Afficher :

```txt
quiz débloqués
coins dépensés
réponses purgées
quiz en limite gratuite
```

---

# Roadmap synthétique

## Court terme

- [x] Créer un vrai mode preview non comptabilisé
- [x] Créer `QuizAttempt`
- [x] Créer `QuizAttemptAnswer`
- [x] Enregistrer les réponses anonymes détaillées par défaut
- [x] Exclure les previews des stats
- [x] Afficher les stats globales gratuites
- [x] Afficher 3 parties détaillées gratuitement

## Moyen terme

- [x] Modèle quota (20 réponses terminées, 3 parties visibles)
- [x] Masquer les parties au-delà de l’aperçu gratuit
- [x] Ajouter déblocage par coins (40 coins, définitif)
- [x] Ajouter table `QuizUnlock`
- [x] Ajouter paywall quota / déblocage
- [x] Ajouter modes anonymes / pseudo / nom+email
- [ ] Export CSV

## Plus tard

- [x] Packs de coins Stripe
- [x] Offre Pro / abonnement
- [x] Jobs de purge automatisés (quota + inactivité)
- [ ] Page “Mes quiz joués”
- [ ] Incitation à créer un compte après le résultat
- [ ] Admin avancé

---

# Points de vigilance

## UX

- Ne pas faire payer trop tôt.
- Ne pas cacher les modes de participation dans un drawer peu visible.
- Ne pas confondre preview et vraie participation.
- Ne pas rendre la mécanique de limite gratuite trop anxiogène.

## BDD

- Ne pas stocker de snapshots lourds en V1.
- Ne pas conserver les détails indéfiniment en gratuit.
- Ne pas compter les previews dans les stats.
- Prévoir des index propres sur `quizId`, `attemptId`, `userId`, `completedAt`, `detailsPurgeAt`.

## RGPD

- Informer clairement les joueurs.
- Nom/email visibles par le créateur uniquement si explicitement collectés.
- Ne pas vérifier les emails participants en V1.
- Supprimer/anonymiser les détails purgés (quiz gratuits inactifs non débloqués).
- Éviter de promettre un anonymat juridique absolu si des données techniques existent.

---

# Formule produit finale

```txt
Crée ton quiz gratuitement.
Reçois tes 20 premières réponses.
Débloque le quiz quand tu veux aller plus loin.

Créer et partager un quiz reste gratuit.
Les statistiques globales restent gratuites.
3 parties détaillées visibles gratuitement par quiz.
40 coins pour débloquer un quiz définitivement.
Pro débloque tous les quiz tant que l’abonnement est actif.
La preview permet au créateur de tester sans polluer les statistiques.
```
