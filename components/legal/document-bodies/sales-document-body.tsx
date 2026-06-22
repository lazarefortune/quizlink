import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { SupportEmailLink } from "@/components/legal/support-email-link";

export function SalesDocumentBody() {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>1. Objet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Les présentes conditions générales de vente (CGV) régissent la vente des produits
            numériques proposés sur la plateforme{" "}
            <strong className="text-foreground">QuizLink</strong>, éditée par Lazare Fortune.
            Elles complètent les conditions générales d&apos;utilisation (CGU).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Produits vendus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <div className="space-y-2">
            <p className="font-medium text-foreground">Coins</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Les coins sont des crédits numériques internes à QuizLink. Ils ne constituent
                pas une monnaie réelle.
              </li>
              <li>
                40 coins permettent de débloquer définitivement un quiz. Un quiz débloqué avec
                coins reste débloqué.
              </li>
              <li>
                Les coins peuvent aussi servir à d&apos;autres fonctionnalités consommatrices de
                crédits (par exemple la génération assistée par IA), selon les règles affichées
                dans l&apos;application.
              </li>
              <li>
                Les coins ne sont pas échangeables contre de l&apos;argent et ne sont pas
                transférables à un autre compte, sauf fonctionnalité expressément prévue ultérieurement.
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground">Abonnement Pro</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Pro est un abonnement. Tant qu&apos;il est actif, il débloque l&apos;ensemble de
                tes quiz selon les avantages affichés dans l&apos;application.
              </li>
              <li>
                Si Pro expire ou est annulé, les quiz non débloqués avec coins reviennent au plan
                gratuit.
              </li>
              <li>
                Les quiz déjà débloqués avec coins restent débloqués, y compris après la fin de
                Pro.
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground">Plan gratuit (rappel)</p>
            <p>
              Sans achat, chaque quiz bénéficie d&apos;un nombre limité de réponses terminées
              gratuites et d&apos;un accès aux statistiques simples. Les règles détaillées sont
              affichées dans l&apos;application.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Prix</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Les prix des packs de coins et de l&apos;abonnement Pro sont indiqués en euros,{" "}
            <strong className="text-foreground">TTC</strong> lorsque applicable, sur la page
            d&apos;achat ou le tunnel de paiement Stripe, avant validation. Le prix applicable
            est celui affiché au moment où tu confirmes le paiement.
          </p>
          <p>
            Lazare Fortune est non assujetti à la TVA (article 293 B du CGI) ; le prix TTC
            correspond alors au prix toutes taxes comprises dans cette situation.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Paiement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Le paiement est effectué via <strong className="text-foreground">Stripe</strong> (carte
            bancaire ou moyens proposés par Stripe Checkout). QuizLink ne stocke pas les numéros
            de carte.
          </p>
          <p>
            Après validation du paiement par Stripe, les coins sont crédités ou l&apos;abonnement
            Pro activé selon le produit acheté. Une confirmation est affichée dans
            l&apos;application ou lors du retour sur QuizLink après la session de paiement.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Utilisation des coins</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Lorsque tu utilises des coins pour débloquer un quiz ou consommer une fonctionnalité,
            la prestation correspondante est réputée exécutée pour cette utilisation. Le coût en
            coins est indiqué avant confirmation.
          </p>
          <p>
            En cas de dysfonctionnement technique empêchant le crédit ou l&apos;activation malgré
            un paiement validé, contacte le support aux coordonnées ci-dessous.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Droit de rétractation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Si tu es consommateur, tu disposes en principe d&apos;un délai légal de rétractation
            pour les contrats conclus à distance, sauf exceptions prévues par la loi.
          </p>
          <p>
            Pour les contenus ou services numériques fournis immédiatement, l&apos;exécution peut
            commencer avant la fin du délai si tu y consent expressément. Si des coins sont
            consommés immédiatement pour débloquer un quiz ou activer une fonctionnalité, le
            remboursement peut être limité selon les règles applicables.
          </p>
          <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <strong className="text-foreground">À valider juridiquement :</strong> formulation
            définitive du consentement à l&apos;exécution immédiate et des conséquences sur le
            droit de rétractation (case à cocher, texte exact, preuve du consentement).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Remboursements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Un remboursement peut être accordé en cas d&apos;erreur technique avérée ou
            d&apos;obligation légale impérative.
          </p>
          <p>
            Les coins déjà consommés pour débloquer un quiz ou utiliser une fonctionnalité ne sont
            pas automatiquement remboursables. Toute demande doit être adressée au support et
            sera examinée au cas par cas.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>8. Résiliation de l&apos;abonnement Pro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Tu peux annuler ton abonnement Pro depuis l&apos;espace de gestion prévu dans
            l&apos;application (portail Stripe ou équivalent). L&apos;accès Pro reste actif
            jusqu&apos;à la fin de la période déjà payée, sauf disposition contraire affichée lors
            de l&apos;annulation.
          </p>
          <p>
            À l&apos;expiration de Pro, les quiz non débloqués avec coins reviennent au plan
            gratuit. Les quiz déjà débloqués avec coins restent débloqués.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>9. Médiation de la consommation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Conformément aux dispositions du Code de la consommation, le consommateur peut recourir
            gratuitement à un médiateur de la consommation en vue de la résolution amiable d&apos;un
            litige.
          </p>
          <p className="rounded-lg border border-dashed border-border bg-muted/40 p-3 text-sm">
            <strong className="text-foreground">À compléter :</strong> nom et coordonnées du
            médiateur de la consommation choisi, avant ouverture commerciale.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>10. Disponibilité du service</CardTitle>
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
          <CardTitle>11. Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Pour toute question relative aux présentes CGV ou à une commande : <SupportEmailLink />.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
