"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";

export function CoinsRequiredOverlay() {
  const { locale } = useLocale();

  return (
    <Card className="mx-4 w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Coins className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {t(locale, "generate.insufficientCoinsTitle")}
          </CardTitle>
          <CardDescription className="text-base">
            {t(locale, "generate.insufficientCoinsDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href="/pricing" className="block">
            <Button variant="primary" className="w-full" size="lg">
              {t(locale, "generate.getCoins")}
            </Button>
          </Link>
        </CardContent>
      </Card>
  );
}
