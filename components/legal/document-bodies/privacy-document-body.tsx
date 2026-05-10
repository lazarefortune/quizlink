import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
            <li>identité et compte : nom, adresse email ;</li>
            <li>connexion Google (OAuth) : identifiant fourni par Google lorsque tu utilises cette option ;</li>
            <li>activité liée aux quiz : quiz créés, contenus associés, réponses et tentatives lorsque ces données transitent par le service ;</li>
            <li>solde et mouvements de crédits (« coins ») lorsque la fonctionnalité est activée ;</li>
            <li>préférences de notifications (emails liés aux quiz, nouveautés produit, marketing) lorsque tu les configures dans ton compte.</li>
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
            <li>créer et gérer ton compte, authentifier les utilisateurs et assurer la sécurité du service ;</li>
            <li>permettre la création, le partage et l&apos;analyse des quiz ;</li>
            <li>envoyer les emails nécessaires au fonctionnement du compte (ex. vérification, sécurité, confirmations) ;</li>
            <li>respecter nos obligations légales et prévenir la fraude ;</li>
            <li>améliorer le service (mesures d&apos;audience ou diagnostics techniques, selon les réglages et le consentement le cas échéant).</li>
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
              <strong className="text-foreground">Emails transactionnels</strong> (compte, sécurité,
              confirmations importantes) : envoyés lorsque cela est nécessaire au service, sans
              marketing.
            </li>
            <li>
              <strong className="text-foreground">Notifications liées à l&apos;activité</strong> (par
              exemple des emails concernant tes quiz) : selon les préférences disponibles dans ton
              compte lorsque cette option est proposée.
            </li>
            <li>
              <strong className="text-foreground">Nouveautés et astuces produit</strong> : uniquement
              si tu as accepté de les recevoir (opt-in), lorsque cette option est disponible.
            </li>
            <li>
              <strong className="text-foreground">Marketing et offres commerciales</strong> : uniquement
              avec un consentement distinct (opt-in), lorsque cette option est disponible.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Conservation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Les données sont conservées pendant la durée nécessaire aux finalités décrites et aux
            obligations légales. Les comptes inactifs ou supprimés font l&apos;objet de traitements
            conformes à nos obligations et à la sécurité du service.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Tes droits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Conformément au RGPD, tu disposes notamment d&apos;un droit d&apos;accès, de
            rectification et de suppression, ainsi que de droits sur la limitation ou l&apos;opposition
            dans les cas prévus par la loi. Tu peux exercer tes droits en nous contactant à
            l&apos;adresse ci-dessous.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Contact</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>
            Pour toute question relative à cette politique ou à tes données personnelles :{" "}
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
