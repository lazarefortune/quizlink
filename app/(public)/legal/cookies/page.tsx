import { LegalStaticLayout } from "@/components/legal/legal-static-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LegalCookiesPage() {
  return (
    <LegalStaticLayout title="Politique cookies">
      <Card>
        <CardHeader>
          <CardTitle>1. Qu&apos;est-ce qu&apos;un cookie ?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Un cookie est un petit fichier déposé sur ton terminal lors de la visite d&apos;un site.
            Il permet de mémoriser des informations pour le bon fonctionnement du service ou, avec
            ton accord, pour la mesure d&apos;audience.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Cookies nécessaires</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Certains cookies (ou stockages équivalents, comme le stockage local pour mémoriser ton
            choix de consentement) sont nécessaires au fonctionnement du site : session, sécurité
            (par exemple protection contre certaines attaques), mémorisation de tes préférences
            essentielles. Ils ne peuvent pas être refusés sans impacter le service.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Mesure d&apos;audience et cookies optionnels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Lorsque nous utilisons des outils de mesure d&apos;audience ou des fonctionnalités
            analytiques optionnelles, ceux-ci peuvent déposer des cookies ou collecter des données
            techniques uniquement dans le respect de ton choix, lorsque la loi l&apos;exige. Tu peux
            refuser les cookies non nécessaires via le bandeau ou la bannière de consentement
            proposée sur le site, lorsqu&apos;elle est affichée.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Gestion du consentement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Tu peux à tout moment modifier ou retirer ton consentement pour les cookies et traceurs
            non nécessaires via le lien prévu en bas de page (par exemple « Gérer mes cookies »)
            ou depuis ton espace compte lorsque cette option est disponible.
          </p>
          <p>
            Les cookies strictement nécessaires au fonctionnement du site restent actifs même si tu
            refuses les cookies optionnels.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Contact</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>
            Pour toute question relative aux cookies :{" "}
            <a
              href="mailto:lazarefortune@gmail.com"
              className="text-primary font-medium hover:underline"
            >
              lazarefortune@gmail.com
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </LegalStaticLayout>
  );
}
