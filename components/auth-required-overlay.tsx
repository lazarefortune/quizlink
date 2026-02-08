"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";

type AuthRequiredOverlayProps = {
  title?: string;
  description?: string;
  /** Optional: path to redirect after signup (e.g. /builder, /generate) */
  returnUrl?: string;
};

export function AuthRequiredOverlay({
  title,
  description,
  returnUrl,
}: AuthRequiredOverlayProps) {
  const { locale } = useLocale();
  const signupHref = returnUrl
    ? `/auth/signup?callbackUrl=${encodeURIComponent(returnUrl)}`
    : "/auth/signup";
  const signinHref = returnUrl
    ? `/auth/signin?callbackUrl=${encodeURIComponent(returnUrl)}`
    : "/auth/signin";

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background/90 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md border-0 shadow-[var(--shadow-neu-raised)]">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-xl md:text-2xl font-semibold">
            {title || t(locale, "auth.required.title")}
          </CardTitle>
          <CardDescription className="text-base mt-1.5">
            {description || t(locale, "auth.required.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <Link href={signupHref} className="block">
            <Button variant="primary" className="w-full" size="lg">
              {t(locale, "auth.required.primaryCta")}
            </Button>
          </Link>
          <p className="text-center">
            <Link
              href={signinHref}
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            >
              {t(locale, "auth.required.hasAccount")} {t(locale, "auth.required.signIn")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
