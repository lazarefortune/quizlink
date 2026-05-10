import { AccountLegalPageShell } from "@/components/legal/account-legal-page-shell";
import { CookiesDocumentBody } from "@/components/legal/document-bodies/cookies-document-body";

export default function AccountLegalCookiesPage() {
  return (
    <AccountLegalPageShell title="Politique cookies">
      <CookiesDocumentBody />
    </AccountLegalPageShell>
  );
}
