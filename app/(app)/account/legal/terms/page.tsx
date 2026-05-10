import { AccountLegalPageShell } from "@/components/legal/account-legal-page-shell";
import { TermsDocumentBody } from "@/components/legal/document-bodies/terms-document-body";
import { CURRENT_TERMS_VERSION } from "@/lib/legal-versions";

export default function AccountLegalTermsPage() {
  return (
    <AccountLegalPageShell
      title="Conditions générales d'utilisation"
      versionLabel={`Version ${CURRENT_TERMS_VERSION}`}
    >
      <TermsDocumentBody />
    </AccountLegalPageShell>
  );
}
