import { Mail, Globe } from "lucide-react";

import { BrandQuizLinkText } from "@/components/BrandQuizLinkText";
import { SupportEmailLink } from "@/components/legal/support-email-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LegalMentionsHeading() {
  return (
    <>
      <h2 id="mentions-legales" className="mb-2 scroll-mt-24 text-2xl font-bold">
        Mentions légales
      </h2>
      <p className="mb-8 text-muted-foreground">
        Dernière mise à jour :{" "}
        {new Date().toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>
    </>
  );
}

export function LegalMentionsCardSections() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Éditeur du site</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Le site{" "}
            <strong className="text-foreground">
              <BrandQuizLinkText />
            </strong>{" "}
            est édité par :
          </p>
          <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
            <p>
              <strong className="text-foreground">Lazare Fortune</strong>
            </p>
            <p className="text-muted-foreground">
              11 avenue Auguste Rodin
              <br />
              94350 Villiers-sur-Marne, France
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">SIRET</strong>: 992 822 510 00010
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Code APE</strong>: 6201Z — Programmation informatique
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">TVA</strong>: non applicable – article 293 B du CGI
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Responsable de publication</strong> : Lazare
              Fortune
            </p>
            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              <span className="flex items-center gap-2 text-primary">
                <Mail className="h-4 w-4" />
                <SupportEmailLink />
              </span>
              <a
                href="https://lazarefortune.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Globe className="h-4 w-4" />
                lazarefortune.com
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Hébergeur du site</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Le site est hébergé sur un serveur VPS fourni par :</p>
          <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
            <p>
              <strong className="text-foreground">Hostinger International Ltd.</strong>
            </p>
            <p className="text-muted-foreground">
              61 Lordou Vironos Street
              <br />
              6023 Larnaca, Chypre
            </p>
            <p className="text-muted-foreground">
              Site web :{" "}
              <a
                href="https://www.hostinger.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                www.hostinger.fr
              </a>
            </p>
            <p className="text-muted-foreground">Téléphone : +33 1 76 54 41 25</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Propriété intellectuelle</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            L&apos;ensemble des contenus (textes, images, logos, code) présents sur le site sont la
            propriété exclusive de Lazare Fortune, sauf mention contraire. Toute reproduction ou
            diffusion sans autorisation est interdite.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Données personnelles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Les informations personnelles collectées via ce site sont utilisées uniquement pour les
            finalités déclarées (création de compte, gestion des quiz, statistiques). Conformément au
            RGPD, tu disposes d&apos;un droit d&apos;accès, de rectification et de suppression de tes
            données.
          </p>
          <p className="text-muted-foreground">
            Pour exercer ce droit, tu peux nous contacter à l&apos;adresse suivante :{" "}
            <SupportEmailLink />
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Pour toute question concernant les mentions légales du site, tu peux contacter Lazare
            Fortune à l&apos;adresse suivante : <SupportEmailLink />.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
