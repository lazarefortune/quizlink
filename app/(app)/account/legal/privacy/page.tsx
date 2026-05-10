import { AccountLegalPageShell } from "@/components/legal/account-legal-page-shell";
import { PrivacyDocumentBody } from "@/components/legal/document-bodies/privacy-document-body";
import { CURRENT_PRIVACY_VERSION } from "@/lib/legal-versions";

export default function AccountLegalPrivacyPage() {
  return (
    <AccountLegalPageShell
      title="Politique de confidentialité"
      versionLabel={`Version ${CURRENT_PRIVACY_VERSION}`}
    >
      <PrivacyDocumentBody />
    </AccountLegalPageShell>
  );
}
