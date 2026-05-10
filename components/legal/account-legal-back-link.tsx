"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";

export function AccountLegalBackLink() {
  const { locale } = useLocale();

  return (
    <Link href="/account">
      <Button variant="ghost" className="mb-4 -ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t(locale, "account.legalBackToAccount")}
      </Button>
    </Link>
  );
}
