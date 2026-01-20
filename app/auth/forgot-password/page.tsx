"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import Link from "next/link";
import { requestPasswordResetAction } from "../reset-password/actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { locale } = useLocale();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSuccess(false);
    setIsLoading(true);

    try {
      const result = await requestPasswordResetAction(email, locale);
      if (result.success) {
        setIsSuccess(true);
      } else {
        setError(result.error || t(locale, "auth.forgotPasswordPage.error"));
      }
    } catch (err) {
      setError(t(locale, "auth.forgotPasswordPage.error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t(locale, "auth.forgotPasswordPage.title")}</CardTitle>
          <CardDescription>{t(locale, "auth.forgotPasswordPage.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="space-y-4">
              <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-950/50 rounded-md">
                {t(locale, "auth.forgotPasswordPage.success")}
              </div>
              <Link href="/auth/signin">
                <Button variant="primary" className="w-full">
                  {t(locale, "auth.signIn.button")}
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t(locale, "auth.email")}
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={t(locale, "auth.emailPlaceholder")}
                />
              </div>
              <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
                {isLoading ? t(locale, "common.loading") : t(locale, "auth.forgotPasswordPage.send")}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                <Link href="/auth/signin" className="text-primary hover:underline">
                  {t(locale, "auth.forgotPasswordPage.backToSignIn")}
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
