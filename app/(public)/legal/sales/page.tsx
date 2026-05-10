import { LegalStaticLayout } from "@/components/legal/legal-static-layout";
import { SalesDocumentBody } from "@/components/legal/document-bodies/sales-document-body";
import { CURRENT_SALES_VERSION } from "@/lib/legal-versions";

export default function LegalSalesPage() {
  const versionLabel = `Version ${CURRENT_SALES_VERSION}`;

  return (
    <LegalStaticLayout
      title="Conditions générales de vente"
      versionLabel={versionLabel}
    >
      <SalesDocumentBody />
    </LegalStaticLayout>
  );
}
