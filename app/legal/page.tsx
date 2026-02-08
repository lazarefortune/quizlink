import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, Globe } from "lucide-react";

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-2">Mentions légales</h1>
          <p className="text-muted-foreground">
            Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="space-y-6">
          {/* Éditeur du site */}
          <Card>
            <CardHeader>
              <CardTitle>1. Éditeur du site</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Le site <strong className="text-foreground">QuizLink</strong> est édité par :
              </p>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
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
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <a
                    href="mailto:lazarefortune@gmail.com"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Mail className="h-4 w-4" />
                    lazarefortune@gmail.com
                  </a>
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

          {/* Hébergeur */}
          <Card>
            <CardHeader>
              <CardTitle>2. Hébergeur du site</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Le site est hébergé sur un serveur VPS fourni par :
              </p>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
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
                <p className="text-muted-foreground">
                  Téléphone : +33 1 76 54 41 25
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Propriété intellectuelle */}
          <Card>
            <CardHeader>
              <CardTitle>3. Propriété intellectuelle</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                L'ensemble des contenus (textes, images, logos, code) présents sur le site sont la propriété exclusive de Lazare Fortune, sauf mention contraire. Toute reproduction ou diffusion sans autorisation est interdite.
              </p>
            </CardContent>
          </Card>

          {/* Données personnelles */}
          <Card>
            <CardHeader>
              <CardTitle>4. Données personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Les informations personnelles collectées via ce site sont utilisées uniquement pour les finalités déclarées (création de compte, gestion des quiz, statistiques). Conformément au RGPD, tu disposes d'un droit d'accès, de rectification et de suppression de tes données.
              </p>
              <p className="text-muted-foreground">
                Pour exercer ce droit, tu peux nous contacter à l'adresse suivante :{" "}
                <a
                  href="mailto:lazarefortune@gmail.com"
                  className="text-primary hover:underline"
                >
                  lazarefortune@gmail.com
                </a>
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>5. Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Pour toute question concernant les mentions légales du site, tu peux contacter Lazare Fortune à l'adresse suivante :{" "}
                <a
                  href="mailto:lazarefortune@gmail.com"
                  className="text-primary hover:underline"
                >
                  lazarefortune@gmail.com
                </a>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer note */}
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} QuizLink. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}
