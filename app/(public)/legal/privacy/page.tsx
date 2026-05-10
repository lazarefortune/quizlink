import { LegalStaticLayout } from "@/components/legal/legal-static-layout";
import { PrivacyDocumentBody } from "@/components/legal/document-bodies/privacy-document-body";
import { CURRENT_PRIVACY_VERSION } from "@/lib/legal-versions";

export default function LegalPrivacyPage() {
  const versionLabel = `Version ${CURRENT_PRIVACY_VERSION}`;

  return (
    <LegalStaticLayout title="Politique de confidentialité" versionLabel={versionLabel}>
      <PrivacyDocumentBody />
    </LegalStaticLayout>
  );
}
