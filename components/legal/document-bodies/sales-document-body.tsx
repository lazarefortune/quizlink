import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SalesDocumentBody() {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>1. Objet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Les présentes conditions générales de vente (CGV) régissent la vente des crédits
            (« coins ») et des packs de coins proposés sur la plateforme{" "}
            <strong className="text-foreground">QuizLink</strong>, éditée par Lazare Fortune.
            Elles complètent les conditions générales d&apos;utilisation (CGU).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Services payants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            QuizLink permet notamment d&apos;acheter des packs de coins pour utiliser des
            fonctionnalités payantes, en particulier la génération de quiz assistée par
            intelligence artificielle, selon les règles et tarifs affichés dans
            l&apos;application au moment de la commande.
          </p>
          <p>
            Les coins sont une monnaie virtuelle interne au service : ils n&apos;ont pas de
            valeur monétaire en dehors de QuizLink et ne sont pas échangeables contre des
            espèces.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Prix</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Les prix des packs sont indiqués en euros, <strong className="text-foreground">TTC</strong>{" "}
            (toutes taxes comprises), sur la page d&apos;achat ou le tunnel de paiement, avant
            validation de la commande. Lazare Fortune est non assujetti à la TVA (article 293 B
            du CGI) ; le prix TTC correspond alors au prix toutes taxes comprises dans cette
            situation.
          </p>
          <p>
            Les offres et tarifs peuvent être modifiés ; le prix applicable est celui affiché
            au moment où tu valides le paiement.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Commande et paiement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Le paiement est effectué via un prestataire tiers,{" "}
            <strong className="text-foreground">Stripe</strong> (paiement sécurisé par carte
            bancaire ou moyens proposés par Stripe Checkout), conformément à la politique de
            Stripe et aux informations affichées lors du règlement.
          </p>
          <p>
            La commande est réputée ferme après acceptation du paiement par Stripe et
            confirmation affichée dans l&apos;application ou par retour sur QuizLink après
            session de paiement.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Crédit des coins</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Les coins achetés sont crédités sur ton compte après confirmation du paiement par
            Stripe (notamment lorsque la session de paiement est complétée avec succès et le
            webhook de paiement traité côté serveur).
          </p>
          <p>
            En cas de dysfonctionnement technique empêchant le crédit malgré un paiement
            validé, tu peux nous contacter aux coordonnées indiquées ci-dessous pour
            rectification.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Utilisation des coins</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Les coins permettent d&apos;accéder à des fonctionnalités consommatrices de crédits,
            notamment la génération de quiz avec l&apos;IA, selon le coût en coins affiché dans
            l&apos;application avant utilisation.
          </p>
          <p>
            Une fois une fonctionnalité utilisée et les coins débités, la prestation est
            réputée exécutée pour cette utilisation.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Remboursements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Les <strong className="text-foreground">coins déjà consommés</strong> (utilisés
            pour une génération ou une autre fonctionnalité payante) ne font l&apos;objet
            d&apos;aucun remboursement ni recrédit, sauf obligation légale impérative.
          </p>
          <p>
            Pour les coins non utilisés, toute demande de remboursement doit être adressée par
            email ; elle sera examinée au cas par cas, dans le respect du droit applicable.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>8. Droit de rétractation et exécution immédiate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Conformément au droit applicable aux contrats conclus à distance, tu disposes
            d&apos;un délai de rétractation lorsque celui-ci s&apos;applique.
          </p>
          <p>
            Pour un <strong className="text-foreground">contenu numérique non fourni sur un
            support matériel</strong>, en demandant l&apos;exécution immédiate avant la fin du
            délai de rétractation et en y consentant expressément, tu reconnais perdre ton droit
            de rétractation une fois la prestation entièrement exécutée (par exemple après
            consommation des coins pour une génération).
          </p>
          <p>
            Les modalités exactes peuvent dépendre de ta qualité (consommateur ou professionnel)
            et du droit applicable ; en cas de doute, contacte-nous.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>9. Disponibilité du service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            QuizLink est fourni sous réserve d&apos;une disponibilité technique raisonnable
            (maintenance, mises à jour, cas de force majeure ou défaillance des hébergeurs ou
            prestataires tiers pouvant affecter l&apos;accès au service ou au paiement).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>10. Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Pour toute question relative aux présentes CGV ou à une commande :{" "}
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
