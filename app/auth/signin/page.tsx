"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn as nextAuthSignIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import Link from "next/link";
import { checkEmailVerified } from "./actions";
import { useToast } from "@/components/ui/toast";

function SignInForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale } = useLocale();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check for verified parameter and show toast
  useEffect(() => {
    const verified = searchParams.get("verified");
    if (verified === "true") {
      showToast(t(locale, "auth.verifyEmail.success"), "success");
      // Clean up URL
      router.replace("/auth/signin");
    }
  }, [searchParams, locale, showToast, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await nextAuthSignIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Check if user exists and if email is not verified
        const emailCheck = await checkEmailVerified(email);
        // Only redirect to verify-email if user exists but email is not verified
        if (emailCheck.exists && !emailCheck.verified) {
          router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
          return;
        }
        // Otherwise, show invalid credentials error
        setError(t(locale, "auth.signIn.invalidCredentials"));
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(t(locale, "auth.signIn.error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t(locale, "auth.signIn.title")}</CardTitle>
          <CardDescription>{t(locale, "auth.signIn.description")}</CardDescription>
        </CardHeader>
        <CardContent>
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
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t(locale, "auth.password")}
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={t(locale, "auth.passwordPlaceholder")}
              />
            </div>
            <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
              {isLoading ? t(locale, "common.loading") : t(locale, "auth.signIn.button")}
            </Button>
            <div className="space-y-2">
              <p className="text-sm text-center text-muted-foreground">
                {t(locale, "auth.noAccount")}{" "}
                <Link href="/auth/signup" className="text-primary hover:underline">
                  {t(locale, "auth.signUpLink")}
                </Link>
              </p>
              <p className="text-sm text-center">
                <Link href="/auth/forgot-password" className="text-primary hover:underline">
                  {t(locale, "auth.forgotPassword")}
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center">{t("fr", "common.loading")}</p>
          </CardContent>
        </Card>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
