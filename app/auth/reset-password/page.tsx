"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import Link from "next/link";
import { resetPasswordAction, validateResetTokenAction } from "./actions";
import { Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale } = useLocale();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
      validateToken(tokenParam);
    } else {
      setIsValidating(false);
      setIsValid(false);
      setError(t(locale, "auth.resetPassword.invalidToken"));
    }
  }, [searchParams, locale]);

  const validateToken = async (tokenValue: string) => {
    setIsValidating(true);
    try {
      const result = await validateResetTokenAction(tokenValue);
      if (result.success && result.valid) {
        setIsValid(true);
      } else {
        setIsValid(false);
        setError(t(locale, "auth.resetPassword.invalidToken"));
      }
    } catch (err) {
      setIsValid(false);
      setError(t(locale, "auth.resetPassword.invalidToken"));
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t(locale, "auth.passwordTooShort"));
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPasswordAction(token, password);
      if (result.success) {
        router.push("/auth/signin?passwordReset=true");
      } else {
        setError(result.error || t(locale, "auth.resetPassword.error"));
      }
    } catch (err) {
      setError(t(locale, "auth.resetPassword.error"));
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center">{t(locale, "common.loading")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t(locale, "auth.resetPassword.invalidToken")}</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md mb-4">
                {error}
              </div>
            )}
            <Link href="/auth/forgot-password">
              <Button variant="primary" className="w-full">
                {t(locale, "auth.forgotPassword.title")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t(locale, "auth.resetPassword.title")}</CardTitle>
          <CardDescription>{t(locale, "auth.resetPassword.description")}</CardDescription>
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
                {t(locale, "auth.resetPassword.newPassword")}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={t(locale, "auth.passwordPlaceholder")}
                  minLength={8}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
              {isLoading ? t(locale, "common.loading") : t(locale, "auth.resetPassword.reset")}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              <Link href="/auth/signin" className="text-primary hover:underline">
                {t(locale, "auth.forgotPassword.backToSignIn")}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
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
      <ResetPasswordForm />
    </Suspense>
  );
}
