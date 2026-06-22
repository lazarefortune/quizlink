import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { SupportEmailLink } from "@/components/legal/support-email-link";

export function CookiesDocumentBody() {
  return (
    <>
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
            Certains cookies ou stockages équivalents sont nécessaires au fonctionnement du site :
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>session et authentification ;</li>
            <li>sécurité (protection contre certaines attaques) ;</li>
            <li>
              mémorisation de tes préférences essentielles, y compris ton choix de consentement
              cookies (stockage local).
            </li>
          </ul>
          <p>Ils ne peuvent pas être refusés sans impacter le service.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Cookies analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            QuizLink utilise <strong className="text-foreground">PostHog</strong> pour comprendre
            l&apos;usage du produit (pages visitées, parcours, événements). Ces traceurs ne sont
            activés qu&apos;après ton consentement via le bandeau cookies, sauf mesures strictement
            nécessaires exemptées.
          </p>
          <p>
            Tu peux retirer ce consentement à tout moment via « Gérer mes cookies » en bas de page
            ou depuis les paramètres proposés dans l&apos;application.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Cookies Stripe (paiement)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Lors d&apos;un paiement via Stripe Checkout, Stripe peut déposer des cookies ou
            technologies similaires nécessaires à la sécurisation et au traitement du paiement.
            Ces cookies relèvent de la politique de Stripe pendant la session de paiement.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Durée de conservation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Les cookies de session expirent à la fermeture du navigateur ou selon leur durée
            technique. Le choix de consentement est conservé localement jusqu&apos;à modification
            ou suppression de tes données de navigation. Les durées exactes des cookies analytics
            dépendent de la configuration PostHog et de ton consentement.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Gérer tes préférences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Tu peux accepter ou refuser les cookies non nécessaires via le bandeau affiché lors de
            ta première visite, puis les modifier via le lien « Gérer mes cookies » en pied de
            page.
          </p>
          <p>
            Les cookies strictement nécessaires restent actifs même si tu refuses les cookies
            optionnels.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Contact</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>
            Pour toute question relative aux cookies : <SupportEmailLink />.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
