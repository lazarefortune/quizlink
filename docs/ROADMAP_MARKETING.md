# Roadmap d’implémentation — Participants, réponses, preview et monétisation QuizLink

## Objectif produit

Construire une version évolutive de QuizLink où :

- la création et le partage d’un quiz restent simples ;
- les créateurs peuvent recevoir des réponses sans configuration complexe ;
- les tests faits par le créateur ne polluent pas les statistiques ;
- les réponses détaillées deviennent un levier de monétisation ;
- la BDD reste maîtrisée grâce à une stratégie de conservation ;
- le système reste compatible avec une future page “Mes quiz joués”.

Positionnement recommandé :

> Créer et partager reste gratuit.
> Les statistiques globales restent gratuites.
> Les réponses détaillées sont gratuites pendant une durée limitée et limitées à 3 réponses.
> Les coins servent à débloquer(prolonger un quiz) et donc conserver les réponses d’un quiz.

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

- Les détails d’une réponse expirent selon la date de soumission de la tentative, pas selon la date de création du quiz.
- Les statistiques globales restent disponibles plus longtemps.
- Les détails individuels peuvent être masqués puis supprimés si le quiz n’est pas débloqué.

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
- ne pas déclencher d’expiration de lien ou de conservation de réponses.

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

# Phase 3 — Réponses détaillées temporaires

## Objectif

Créer un levier de valeur tout en gardant une expérience gratuite utile.

## Règle recommandée

Pour chaque tentative :

```txt
J0 à J+7 : détails visibles gratuitement.
J+7 à J+30 : détails masqués mais récupérables si le quiz est débloqué.
Après J+30 : détails supprimés ou anonymisés si le quiz n’est pas débloqué.
```

## Détails visibles gratuitement

Pendant 7 jours, le créateur peut voir :

```txt
score individuel
réponses question par question
bonnes / mauvaises réponses
durée
nom ou pseudo si collecté
email si collecté
```

## Après J+7

Masquer les détails individuels, mais conserver les stats globales.

UX possible :

```txt
Certaines réponses détaillées ont expiré.
Débloque ce quiz pour consulter et conserver l’historique complet.
```

## Après J+30

Si le quiz n’est pas débloqué :

- supprimer les `QuizAttemptAnswer` ;
- anonymiser ou supprimer `participantName` ;
- anonymiser ou supprimer `participantEmail` ;
- conserver `QuizAttempt` avec score, date, durée, statut.

## Tests manuels

- Créer une tentative avec `detailsVisibleUntil` expiré.
- Vérifier que le détail est masqué.
- Vérifier que les stats globales restent visibles.
- Simuler `detailsPurgeAt` dépassé.
- Vérifier que les détails sont supprimés/anonymisés.

---

# Phase 4 — Déblocage avec coins

## Objectif

Utiliser le système de coins pour débloquer les réponses détaillées d’un quiz.

## Décision recommandée

```txt
Débloquer un quiz : 40 coins.
```

Le déblocage inclut :

```txt
réponses détaillées complètes
participants si collectés
conservation 1 an
lien actif 1 an
export CSV plus tard
```

## Modèle recommandé

Créer une table d’historique plutôt que de tout stocker sur `Quiz`.

### QuizUnlock

```txt
id
quizId
userId
unlockType
coinsSpent
unlockedAt
expiresAt
createdAt
```

`unlockType` :

```txt
DETAILED_RESULTS
```

## Effet du déblocage

Quand un quiz est débloqué :

```txt
resultsUnlockedUntil = now + 1 an
```

ou via `QuizUnlock.expiresAt`.

Toute nouvelle tentative reçue pendant cette période doit avoir ses détails conservés jusqu’à cette date.

## UX recommandée

Si l’utilisateur a assez de coins :

```txt
Débloquer les réponses détaillées — 40 coins
```

Si l’utilisateur n’a pas assez de coins :

```txt
Il te manque 25 coins pour débloquer ce quiz.
Acheter des coins
```

Après déblocage :

```txt
Réponses détaillées débloquées jusqu’au 21 mai 2027.
```

## Tests manuels

- Débloquer un quiz avec assez de coins.
- Vérifier que les coins sont décrémentés une seule fois.
- Vérifier que les réponses détaillées sont visibles.
- Vérifier que la date de conservation longue est appliquée.
- Tester le cas coins insuffisants.

---

# Phase 5 — Expiration des liens de quiz

## Objectif

Éviter que des vieux liens continuent à générer des réponses indéfiniment, tout en créant une future opportunité de monétisation.

## Règle recommandée

Pour les quiz gratuits :

```txt
Lien actif 30 jours après la dernière activité.
```

Activité = nouvelle tentative réelle, pas preview.

Pour un quiz débloqué :

```txt
Lien actif pendant 1 an.
```

## UX côté créateur

```txt
Lien actif encore 27 jours.
```

Si expiré :

```txt
Ce lien ne reçoit plus de nouvelles réponses.
Débloque ce quiz pour le réactiver et conserver l’historique.
```

## UX côté joueur

Si un joueur ouvre un lien expiré :

```txt
Ce quiz n’accepte plus de réponses.
Demande au créateur de le réactiver.
```

## Monétisation

Ne pas faire payer la réactivation seule en V1.

À terme :

```txt
Réactiver le lien 30 jours : 10 coins.
```

Mais au début, le déblocage du quiz doit inclure la prolongation du lien.

## Tests manuels

- Ouvrir un lien actif.
- Simuler un lien expiré.
- Vérifier que le joueur ne peut pas commencer.
- Débloquer le quiz.
- Vérifier que le lien redevient actif.

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

Si le quiz n’est pas débloqué et que les détails sont expirés :

```txt
Réponses détaillées masquées.
Débloque ce quiz avec 40 coins pour consulter l’historique complet.
```

## Tests manuels

- Voir une tentative récente gratuite.
- Voir une tentative expirée masquée.
- Débloquer le quiz.
- Voir toutes les tentatives détaillées.

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
Débloquer les réponses détaillées
Conserver un historique
Exporter les résultats plus tard
Réactiver un lien plus tard
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

### Job de nettoyage

Règles :

```txt
Si detailsPurgeAt < now
et quiz non débloqué
et detailsPurgedAt est null
alors supprimer/anonymiser les détails.
```

### Logs / monitoring

Suivre :

```txt
nombre de tentatives créées
nombre de réponses détaillées stockées
nombre de détails expirés
nombre de détails purgés
nombre de quiz débloqués
coins dépensés
conversion paywall
```

### Admin

Afficher :

```txt
quiz débloqués
coins dépensés
réponses expirées
réponses purgées
liens expirés
```

---

# Roadmap synthétique

## Court terme

- [ ] Créer un vrai mode preview non comptabilisé
- [ ] Créer `QuizAttempt`
- [ ] Créer `QuizAttemptAnswer`
- [ ] Enregistrer les réponses anonymes détaillées par défaut
- [ ] Exclure les previews des stats
- [ ] Afficher les stats globales gratuites
- [ ] Afficher les détails récents gratuitement

## Moyen terme

- [ ] Ajouter expiration des détails par tentative
- [ ] Masquer les détails expirés
- [ ] Ajouter déblocage par coins
- [ ] Ajouter table `QuizUnlock`
- [ ] Ajouter paywall réponses détaillées
- [ ] Ajouter conservation longue 1 an
- [ ] Ajouter modes anonymes / pseudo / nom+email

## Plus tard

- [ ] Expiration des liens par inactivité
- [ ] Réactivation via déblocage du quiz
- [ ] Page “Mes quiz joués”
- [ ] Incitation à créer un compte après le résultat
- [ ] Packs de coins Stripe
- [ ] Export CSV
- [ ] Offre Pro / abonnement
- [ ] Admin avancé
- [ ] Jobs de purge automatisés

---

# Points de vigilance

## UX

- Ne pas faire payer trop tôt.
- Ne pas cacher les modes de participation dans un drawer peu visible.
- Ne pas confondre preview et vraie participation.
- Ne pas rendre la mécanique d’expiration trop anxiogène.

## BDD

- Ne pas stocker de snapshots lourds en V1.
- Ne pas conserver les détails indéfiniment en gratuit.
- Ne pas compter les previews dans les stats.
- Prévoir des index propres sur `quizId`, `attemptId`, `userId`, `completedAt`, `detailsPurgeAt`.

## RGPD

- Informer clairement les joueurs.
- Nom/email visibles par le créateur uniquement si explicitement collectés.
- Ne pas vérifier les emails participants en V1.
- Supprimer/anonymiser les détails expirés.
- Éviter de promettre un anonymat juridique absolu si des données techniques existent.

---

# Formule produit finale

```txt
Créer et partager un quiz reste gratuit.
Les réponses sont enregistrées automatiquement.
Les statistiques globales restent gratuites.
Les réponses détaillées sont visibles gratuitement pendant une durée limitée.
Les coins permettent de débloquer et conserver les réponses d’un quiz.
La preview permet au créateur de tester sans polluer les statistiques.
```
