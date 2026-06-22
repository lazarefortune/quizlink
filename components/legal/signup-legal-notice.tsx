"use client";

import Link from "next/link";

import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";

type SignupLegalNoticeProps = {
  className?: string;
};

export function SignupLegalNotice({ className }: SignupLegalNoticeProps) {
  const { locale } = useLocale();

  return (
    <p
      className={className ?? "text-center text-pretty text-xs leading-snug text-muted-foreground"}
      data-testid="signup-legal-notice"
    >
      {t(locale, "auth.signUp.legalNoticePrefix")}{" "}
      <Link
        href="/legal/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        {t(locale, "auth.signUp.legalNoticeTermsLink")}
      </Link>{" "}
      {t(locale, "auth.signUp.legalNoticeMid")}{" "}
      <Link
        href="/legal/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        {t(locale, "auth.signUp.legalNoticePrivacyLink")}
      </Link>
      {t(locale, "auth.signUp.legalNoticeEnd")}
    </p>
  );
}
