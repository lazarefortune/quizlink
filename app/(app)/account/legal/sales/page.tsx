import { AccountLegalPageShell } from "@/components/legal/account-legal-page-shell";
import { SalesDocumentBody } from "@/components/legal/document-bodies/sales-document-body";
import { CURRENT_SALES_VERSION } from "@/lib/legal-versions";

export default function AccountLegalSalesPage() {
  return (
    <AccountLegalPageShell
      title="Conditions générales de vente"
      versionLabel={`Version ${CURRENT_SALES_VERSION}`}
    >
      <SalesDocumentBody />
    </AccountLegalPageShell>
  );
}
