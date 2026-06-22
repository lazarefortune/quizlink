import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { SupportEmailLink } from "@/components/legal/support-email-link";

export function TermsDocumentBody() {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>1. Présentation du service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            <strong className="text-foreground">QuizLink</strong> est une plateforme en ligne
            permettant de créer, partager et analyser des quiz. Les participants peuvent répondre
            via un lien public. L&apos;utilisation du service implique l&apos;acceptation des
            présentes conditions générales d&apos;utilisation (CGU).
          </p>
          <p>
            QuizLink peut évoluer (fonctionnalités, interface, offres). Les règles applicables sont
            celles publiées sur cette page au moment de ton utilisation.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Création de compte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            L&apos;accès à certaines fonctionnalités nécessite la création d&apos;un compte avec
            des informations exactes. Tu es responsable de la confidentialité de tes identifiants
            et de l&apos;activité réalisée depuis ton compte.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Création et partage de quiz</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Tu peux créer des quiz, les configurer et les partager via des liens publics ou les
            fonctionnalités proposées par le service. Tu t&apos;engages à respecter les lois
            applicables et les droits des tiers (notamment propriété intellectuelle et données
            personnelles des participants).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Responsabilité du créateur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            En tant que créateur de quiz, tu es seul responsable du contenu que tu publies
            (textes, questions, options, médias, paramètres) et des conséquences de son partage.
            QuizLink ne valide pas systématiquement ces contenus avant publication.
          </p>
          <p>
            Tu es responsable des informations que tu demandes aux participants (pseudo, nom,
            email, etc.) et du respect de leurs droits lorsque tu collectes ou affiches ces données.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Plans et fonctionnalités</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Certaines fonctionnalités peuvent être limitées selon ton plan (gratuit, déblocage
            avec coins, abonnement Pro). Les règles affichées dans l&apos;application et les
            conditions générales de vente (CGV) s&apos;appliquent aux offres payantes.
          </p>
          <p>
            Le plan gratuit permet notamment de recevoir un nombre limité de réponses terminées
            par quiz et d&apos;accéder à des statistiques simples. Le déblocage avec coins ou
            l&apos;abonnement Pro ouvre des fonctionnalités supplémentaires selon les règles en
            vigueur.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Contenus interdits et usage abusif</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>Il est notamment interdit de :</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              publier des contenus illicites, haineux, violents, diffamatoires ou portant atteinte
              aux droits d&apos;autrui ;
            </li>
            <li>harceler, spammer ou perturber le service ou d&apos;autres utilisateurs ;</li>
            <li>
              tenter de contourner les mesures de sécurité, les limites d&apos;usage ou la
              facturation ;
            </li>
            <li>
              utiliser le service de manière à nuire à son bon fonctionnement ou à des fins
              frauduleuses.
            </li>
          </ul>
          <p>
            En cas d&apos;usage abusif ou de violation des présentes CGU, QuizLink se réserve le
            droit de suspendre ou supprimer un compte, un quiz ou un accès, sans préjudice des
            recours légaux.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Propriété du contenu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Tu restes propriétaire des contenus que tu crées sur QuizLink. Tu accordes à QuizLink
            une licence limitée, non exclusive, nécessaire pour héberger, afficher et traiter ces
            contenus aux fins de fournir le service (partage, statistiques, sauvegarde technique).
          </p>
          <p>
            Les éléments propres à QuizLink (marque, interface, code) restent la propriété de
            l&apos;éditeur.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>8. Disponibilité et limites de responsabilité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            QuizLink est fourni « en l&apos;état ». Nous mettons en œuvre des moyens raisonnables
            pour assurer la disponibilité du service, sans garantie de continuité absolue. Des
            interruptions (maintenance, incident, force majeure) peuvent survenir.
          </p>
          <p>
            Dans les limites autorisées par la loi, la responsabilité de QuizLink est limitée aux
            dommages directs et prévisibles. QuizLink n&apos;est pas responsable des contenus
            publiés par les utilisateurs ni des usages que les participants font des quiz partagés.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>9. Modification des CGU</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Les CGU peuvent être mises à jour. La version applicable est celle publiée sur cette
            page, avec son numéro de version. En cas de changement substantiel, une information
            pourra être donnée dans l&apos;application ou par email.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>10. Contact support</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>
            Pour toute question relative aux présentes CGU : <SupportEmailLink />.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
