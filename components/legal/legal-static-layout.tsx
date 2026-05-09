import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BrandQuizLinkText } from "@/components/BrandQuizLinkText";
import { Button } from "@/components/ui/button";

type LegalStaticLayoutProps = {
  title: string;
  versionLabel?: string;
  children: React.ReactNode;
};

export function LegalStaticLayout({
  title,
  versionLabel,
  children,
}: LegalStaticLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <div className="mb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 mb-6">
            <Link href="/">
              <Button variant="ghost" className="-ml-2 sm:ml-0">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à l&apos;accueil
              </Button>
            </Link>
            <Link href="/legal">
              <Button variant="ghost">Informations légales</Button>
            </Link>
          </div>
          <h1 className="text-4xl font-bold mb-2">{title}</h1>
          {versionLabel ? (
            <p className="text-muted-foreground">{versionLabel}</p>
          ) : null}
        </div>

        <div className="space-y-6">{children}</div>

        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()}{" "}
            <BrandQuizLinkText className="inline" />. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}
