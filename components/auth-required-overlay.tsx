"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";

type AuthRequiredOverlayProps = {
  title?: string;
  description?: string;
};

export function AuthRequiredOverlay({
  title,
  description
}: AuthRequiredOverlayProps) {
  const { locale } = useLocale();

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="mx-4 w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {title || t(locale, "auth.required.title")}
          </CardTitle>
          <CardDescription className="text-base">
            {description || t(locale, "auth.required.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href="/auth/signup" className="block">
            <Button variant="primary" className="w-full" size="lg">
              {t(locale, "auth.required.createAccount")}
            </Button>
          </Link>
          <Link href="/auth/signin" className="block">
            <Button variant="secondary" className="w-full" size="lg">
              {t(locale, "auth.required.signIn")}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
