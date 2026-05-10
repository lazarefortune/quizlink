"use client";

import { AccountLegalBackLink } from "@/components/legal/account-legal-back-link";
import { LegalDocumentsNavCard } from "@/components/legal/document-bodies/legal-documents-nav-card";
import {
  LegalMentionsCardSections,
  LegalMentionsHeading,
} from "@/components/legal/document-bodies/legal-mentions-sections";
import { LegalInfoPageFooter } from "@/components/legal/legal-info-page-footer";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";

export function AccountLegalInformationIndex() {
  const { locale } = useLocale();

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-5 md:py-8 lg:px-8">
        <AccountLegalBackLink />
        <h1 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
          {t(locale, "account.legalIndexTitle")}
        </h1>
        <p className="mb-6 text-muted-foreground sm:mb-8">
          {t(locale, "account.legalIndexDescription")}
        </p>
        <LegalDocumentsNavCard basePath="/account/legal" />
        <LegalMentionsHeading />
        <LegalMentionsCardSections />
        <LegalInfoPageFooter />
      </div>
    </div>
  );
}
