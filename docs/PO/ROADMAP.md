# QuizLink — Roadmap

## Général

- [ ] Eviter le downtime lors du déploiement

## Phase 1 — Builder & création

- [ ] Améliorer l’admin des feedbacks et adapter les notifications emails de l'admin
- [ ] Ajouter un QR Code pour partager un quiz
- [ ] Ajouter un système de parrainage et de récompenses pour les utilisateurs qui partagent leur quiz
- [ ] Quand un utilisateur choisit de réinitialiser les stats d'un quiz, dans les stats il faut tout remettre à 0. Car actuellement on supprime juste les tentatives.

- [x] Autofocus sur le champ nom du quiz lors d’une nouvelle création
- [ ] Création IA : avertir avant de quitter si du contenu a été saisi, ou faire en async et prévenir l'utilisateur que la génération est en cours ou quand elle est terminée.
- [ ] Pendant la création IA : afficher une animation de chargement propre
- [ ] Activer pour chaque question si elle est obligatoire ou non, par défaut non.
- [ ] Dans la liste des questions dans le dashboard quand on clique sur jouer un quiz je veux que ça ouvre dans un nouvel onglet, pareil sur la page details d'un quiz
- [x] Ajouter “Donner mon avis” avec étoiles
- [x] Ajouter micro-feedback après création d’un quiz
- [x] Ajouter signalement contextualisé après erreur builder
- [x] Améliorer la barre d’outils du textarea
- [x] Sur desktop, afficher en rouge dans la sidebar les questions avec erreur
- [x] Scroll vers la première erreur du formulaire
- [x] Message d’erreur quand le nom d’un quiz est trop long
- [x] Améliorer le champ de durée du quiz avec minutes et secondes séparées
- [x] Sauvegarde automatique du quiz

---

## Phase 2 — Expérience joueur

- [ ] Quand on passe une question qui a une image et qu'on revient à la question précédente, l'image ne s'affiche pas.
- [ ] Harmoniser le flow identifié avec le cookie/session d’attempt
- [ ] Améliorer le design de la page résultat
- [ ] Ajouter une animation de chargement avant le début du quiz
- [ ] Conserver la progression du quiz si l’utilisateur actualise la page
- [ ] Demander au joueur de laisser un feedback après le quiz (5 étoiles)
- [ ] Ajouter la possibilité de laisser un feedback sur la page résultat
- [ ] Ajouter un bouton "Partager" sur la page résultat pour partager le quiz
- [ ] À la fin du quiz, proposer de créer son propre quiz plutôt que seulement recommencer
- [ ] Ouvrir les quiz dans un nouvel onglet quand on veut les lancer
- [x] Accélérer le chargement des images des questions lors du jeu d’un quiz
- [x] Quand on ne coche pas l'option "Afficher la bonne réponse juste après avoir répondu", configurer l'option pour ne jamais afficher les bonnes réponses à l’utilisateur à la fin sur la page résultat
- [x] Améliorer l’affichage du temps et du type de question sur la page quiz
- [x] Ajouter une option “Afficher les réponses à la fin”
- [x] Si désactivée, masquer le détail des réponses dans le récapitulatif
- [x] Renommer l’option actuelle en “Correction après chaque question”
- [x] Vérifier que l’option “mélanger les questions” fonctionne bien côté joueur

---

## Phase 3 — Conversion & compte

- [ ] Améliorer la page d’inscription
- [ ] Connecter automatiquement l’utilisateur après une inscription manuelle
- [ ] Montrer une animation de gain de pièces après l’inscription
- [ ] Améliorer la page d’accueil
- [x] Améliorer le tableau de bord

---

## Phase 4 — IA avancée

- [ ] Au lieu de seulement un champ texte, permettre à l’utilisateur de discuter avec l’IA sur le quiz souhaité
- [ ] Dans le quiz manuel, proposer l’IA dans le champ texte pour corriger et améliorer la rédaction
- [ ] Améliorer l’expérience de génération IA pour que le quiz ne s’affiche que lorsqu’il est prêt

---

## Phase 5 — Sécurité, spam & contact

- [ ] Prévenir le spam et les requêtes multiples depuis un même utilisateur
- [ ] Mettre en place un formulaire de contact public avec captcha

---

## Récemment livré

- [x] Implémenter la déconnexion depuis l'espace admin
- [x] Sur mobile, afficher le numéro des questions dans l’onglet Organiser
- [x] Input “nombre maximum de questions” en génération IA : permettre de vider correctement le champ
- [x] Ajouter Motion sur la page quiz
- [x] Scroll vers le haut et header fixé sur la page quiz
- [x] Scroll automatique vers le haut lors du passage à la question suivante
- [x] Améliorer le tableau de bord
- [x] Améliorer le champ de durée du quiz avec minutes et secondes séparées
- [x] Sauvegarde automatique du quiz
