import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { SupportEmailLink } from "@/components/legal/support-email-link";

export function PrivacyDocumentBody() {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>1. Données collectées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>Selon ton utilisation de QuizLink, nous pouvons traiter notamment :</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-foreground">Données de compte :</strong> adresse email, nom
              éventuel, identifiants de connexion (y compris via Google OAuth le cas échéant).
            </li>
            <li>
              <strong className="text-foreground">Données de quiz :</strong> titres, questions,
              options, paramètres, liens de partage.
            </li>
            <li>
              <strong className="text-foreground">Données de réponses :</strong> réponses
              enregistrées, score, temps, statut terminé ou abandonné.
            </li>
            <li>
              <strong className="text-foreground">Données participant :</strong> pseudo, nom ou
              email lorsque le créateur du quiz les demande ou que le participant les fournit.
            </li>
            <li>
              <strong className="text-foreground">Données paiement :</strong> identifiants Stripe,
              statut d&apos;abonnement, historique d&apos;achat et de crédits — sans stockage des
              numéros de carte par QuizLink.
            </li>
            <li>
              <strong className="text-foreground">Données techniques :</strong> journaux, erreurs,
              mesures de sécurité, adresses IP ou identifiants techniques limités au fonctionnement
              du service.
            </li>
            <li>
              <strong className="text-foreground">Données analytics :</strong> pages visitées,
              événements produit et parcours, via PostHog lorsque tu as accepté les cookies
              analytics correspondants.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Finalités</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>Les données sont utilisées pour :</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>fournir et sécuriser le service ;</li>
            <li>permettre la création, le partage et la participation aux quiz ;</li>
            <li>afficher les statistiques et rapports ;</li>
            <li>gérer les paiements, coins et abonnements ;</li>
            <li>assurer le support utilisateur ;</li>
            <li>respecter nos obligations légales et prévenir la fraude ;</li>
            <li>améliorer le produit (analytics et diagnostics, selon consentement le cas échéant).</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Emails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>Nous distinguons notamment :</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-foreground">Emails transactionnels</strong> (compte,
              sécurité, confirmations) : nécessaires au service.
            </li>
            <li>
              <strong className="text-foreground">Notifications liées à l&apos;activité</strong>{" "}
              (quiz, réponses) : selon tes préférences lorsque l&apos;option est proposée.
            </li>
            <li>
              <strong className="text-foreground">Nouveautés et marketing</strong> : uniquement
              avec consentement distinct (opt-in), lorsque disponible.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Conservation et purge</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Les données sont conservées pendant la durée nécessaire aux finalités décrites et aux
            obligations légales.
          </p>
          <p>
            Les statistiques globales peuvent être conservées via des agrégats. Pour maîtriser le
            stockage et protéger les données personnelles, les réponses détaillées des quiz
            gratuits inactifs peuvent être nettoyées après une période de conservation.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>la purge ne supprime pas le quiz ;</li>
            <li>la purge ne supprime pas les statistiques globales ni les agrégats ;</li>
            <li>
              la purge peut supprimer les réponses détaillées et les informations participant ;
            </li>
            <li>
              les quiz Pro ou débloqués avec coins ne sont pas concernés par cette purge
              automatique selon le modèle actuel.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Sous-traitants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Nous faisons appel à des prestataires pour certaines opérations, notamment :
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-foreground">Stripe</strong> — paiement et abonnements ;
            </li>
            <li>
              <strong className="text-foreground">Hostinger</strong> — hébergement du site ;
            </li>
            <li>
              <strong className="text-foreground">Prestataire email (SMTP)</strong> — envoi des
              emails transactionnels ;
            </li>
            <li>
              <strong className="text-foreground">PostHog</strong> — analytics produit (avec
              consentement lorsque requis) ;
            </li>
            <li>
              <strong className="text-foreground">OpenAI</strong> — génération assistée par IA
              lorsque tu utilises cette fonctionnalité.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Tes droits (RGPD)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>Conformément au RGPD, tu disposes notamment des droits suivants :</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>droit d&apos;accès ;</li>
            <li>droit de rectification ;</li>
            <li>droit de suppression ;</li>
            <li>droit d&apos;opposition ;</li>
            <li>droit à la limitation du traitement ;</li>
            <li>droit à la portabilité, lorsque applicable.</li>
          </ul>
          <p>
            Pour exercer tes droits, contacte-nous à : <SupportEmailLink />.
          </p>
          <p>
            Tu peux aussi introduire une réclamation auprès de la CNIL si tu estimes que tes
            droits ne sont pas respectés.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Contact</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>
            Pour toute question relative à cette politique ou à tes données personnelles :{" "}
            <SupportEmailLink />.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
