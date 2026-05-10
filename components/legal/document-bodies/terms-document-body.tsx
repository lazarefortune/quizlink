import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
            permettant de créer, partager et analyser des quiz. L&apos;utilisation du service
            implique l&apos;acceptation des présentes conditions générales d&apos;utilisation
            (CGU).
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
            Tu peux créer des quiz, les partager via des liens ou des fonctionnalités proposées par
            le service. Tu t&apos;engages à respecter les lois applicables et les droits des tiers
            (notamment propriété intellectuelle et données personnelles des participants).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Responsabilité sur les contenus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Tu es seul responsable des contenus que tu crées, importes ou publies via QuizLink
            (textes, questions, médias, paramètres de quiz). QuizLink ne valide pas systématiquement
            ces contenus avant publication.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Usage des crédits (coins) et fonctionnalités IA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Certaines fonctionnalités (par exemple la génération assistée par IA) peuvent
            consommer des crédits (« coins ») selon les règles affichées dans l&apos;application.
            Les crédits et tarifications peuvent évoluer ; l&apos;usage du service après évolution
            vaut acceptation des nouvelles règles affichées.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Interdictions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>Il est notamment interdit de :</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>publier des contenus illicites, haineux, violents ou portant atteinte aux droits d&apos;autrui ;</li>
            <li>harceler, spammer ou perturber le service ou d&apos;autres utilisateurs ;</li>
            <li>tenter de contourner les mesures de sécurité, les limites d&apos;usage ou la facturation des crédits ;</li>
            <li>utiliser le service de manière à nuire à son bon fonctionnement ou à des fins frauduleuses.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Disponibilité du service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            QuizLink est fourni « en l&apos;état ». Nous mettons en œuvre des moyens raisonnables
            pour assurer la disponibilité du service, sans garantie de continuité absolue. Des
            interruptions (maintenance, incident, force majeure) peuvent survenir.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>8. Modification des CGU</CardTitle>
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
          <CardTitle>9. Contact</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>
            Pour toute question relative aux présentes CGU :{" "}
            <a
              href="mailto:lazarefortune@gmail.com"
              className="font-medium text-primary hover:underline"
            >
              lazarefortune@gmail.com
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </>
  );
}
