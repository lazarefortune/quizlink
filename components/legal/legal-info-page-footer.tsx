import { BrandQuizLinkText } from "@/components/BrandQuizLinkText";

export function LegalInfoPageFooter() {
  return (
    <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
      <p>
        © {new Date().getFullYear()} <BrandQuizLinkText className="inline" />. Tous droits réservés.
      </p>
    </div>
  );
}
