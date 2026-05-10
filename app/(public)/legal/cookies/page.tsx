import { LegalStaticLayout } from "@/components/legal/legal-static-layout";
import { CookiesDocumentBody } from "@/components/legal/document-bodies/cookies-document-body";

export default function LegalCookiesPage() {
  return (
    <LegalStaticLayout title="Politique cookies">
      <CookiesDocumentBody />
    </LegalStaticLayout>
  );
}
