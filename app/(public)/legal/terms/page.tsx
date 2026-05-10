import { LegalStaticLayout } from "@/components/legal/legal-static-layout";
import { TermsDocumentBody } from "@/components/legal/document-bodies/terms-document-body";
import { CURRENT_TERMS_VERSION } from "@/lib/legal-versions";

export default function LegalTermsPage() {
  const versionLabel = `Version ${CURRENT_TERMS_VERSION}`;

  return (
    <LegalStaticLayout
      title="Conditions générales d'utilisation"
      versionLabel={versionLabel}
    >
      <TermsDocumentBody />
    </LegalStaticLayout>
  );
}
