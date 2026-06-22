"use client";

import Link from "next/link";

import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";

type PaymentLegalNoticeProps = {
  className?: string;
};

export function PaymentLegalNotice({ className }: PaymentLegalNoticeProps) {
  const { locale } = useLocale();

  return (
    <p
      className={className ?? "text-xs text-muted-foreground text-center text-pretty"}
      data-testid="payment-legal-notice"
    >
      {t(locale, "legal.paymentNotice.prefix")}{" "}
      <Link href="/legal/sales" className="text-primary hover:underline">
        {t(locale, "legal.paymentNotice.salesLink")}
      </Link>{" "}
      {t(locale, "legal.paymentNotice.and")}{" "}
      <Link href="/legal/privacy" className="text-primary hover:underline">
        {t(locale, "legal.paymentNotice.privacyLink")}
      </Link>
      .
    </p>
  );
}
