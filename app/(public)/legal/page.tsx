import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

import { LegalDocumentsNavCard } from "@/components/legal/document-bodies/legal-documents-nav-card";
import {
  LegalMentionsCardSections,
  LegalMentionsHeading,
} from "@/components/legal/document-bodies/legal-mentions-sections";
import { LegalInfoPageFooter } from "@/components/legal/legal-info-page-footer";

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l&apos;accueil
            </Button>
          </Link>
          <h1 className="mb-2 text-4xl font-bold">Informations légales</h1>
          <p className="mb-6 text-muted-foreground">
            Retrouve ici les documents qui encadrent l&apos;utilisation de QuizLink.
          </p>

          <LegalDocumentsNavCard basePath="/legal" />

          <LegalMentionsHeading />
        </div>

        <LegalMentionsCardSections />

        <LegalInfoPageFooter />
      </div>
    </div>
  );
}
