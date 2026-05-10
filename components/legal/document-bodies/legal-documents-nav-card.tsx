import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type LegalDocumentsNavCardProps = {
  /** e.g. `/legal` or `/account/legal` */
  basePath: string;
};

export function LegalDocumentsNavCard({ basePath }: LegalDocumentsNavCardProps) {
  const mentionsHref =
    basePath === "/legal" ? "#mentions-legales" : `${basePath}#mentions-legales`;

  return (
    <Card className="mb-10">
      <CardHeader>
        <CardTitle>Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          <li>
            <a href={mentionsHref} className="font-medium text-primary hover:underline">
              Mentions légales
            </a>
            <span className="text-muted-foreground">
              {" "}
              — éditeur, hébergement, propriété intellectuelle
            </span>
          </li>
          <li>
            <Link href={`${basePath}/terms`} className="font-medium text-primary hover:underline">
              Conditions générales d&apos;utilisation
            </Link>
          </li>
          <li>
            <Link href={`${basePath}/privacy`} className="font-medium text-primary hover:underline">
              Politique de confidentialité
            </Link>
          </li>
          <li>
            <Link href={`${basePath}/sales`} className="font-medium text-primary hover:underline">
              Conditions générales de vente (CGV)
            </Link>
            <span className="text-muted-foreground">
              {" "}
              — achat de coins, paiement, remboursements
            </span>
          </li>
          <li>
            <Link href={`${basePath}/cookies`} className="font-medium text-primary hover:underline">
              Politique cookies
            </Link>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
