"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { authFormItemVariants } from "@/lib/auth-motion-variants";
import { resetPasswordAction, validateResetTokenAction } from "./actions";
import { ResetPasswordSidePanel } from "@/components/auth/reset-password-side-panel";
import {
  AuthFormCard,
  AuthFormCardContent,
  AuthFormColumn,
  AuthFormHeader,
  AuthFormMascot,
  AuthFormPage,
} from "@/components/auth/auth-form-layout";
import {
  Eye,
  EyeOff,
  KeyRound,
  ArrowLeft,
  Check,
  ArrowRight,
  AlertCircle,
  Lock,
} from "lucide-react";

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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- validateToken is stable, intentional deps
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
    } catch {
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
    } catch {
      setError(t(locale, "auth.resetPassword.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const passwordOk = password.length >= 8;

  if (isValidating) {
    return (
      <AuthFormPage sidePanel={<ResetPasswordSidePanel />}>
        <AuthFormColumn>
          <AuthFormCard>
            <AuthFormCardContent className="text-center">
              <AuthFormMascot locale={locale} />
              <motion.div
                variants={authFormItemVariants}
                className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"
              >
                <KeyRound className="h-8 w-8 text-primary animate-pulse" />
              </motion.div>
              <motion.p
                variants={authFormItemVariants}
                className="mt-4 text-muted-foreground"
              >
                {t(locale, "common.loading")}
              </motion.p>
            </AuthFormCardContent>
          </AuthFormCard>
        </AuthFormColumn>
      </AuthFormPage>
    );
  }

  if (!isValid) {
    return (
      <AuthFormPage sidePanel={<ResetPasswordSidePanel />}>
        <AuthFormColumn>
          <AuthFormCard variant="playful">
            <AuthFormCardContent className="text-center">
              <AuthFormMascot locale={locale} />
              <motion.div
                variants={authFormItemVariants}
                className="mb-4 flex justify-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
              </motion.div>
              <motion.h1
                variants={authFormItemVariants}
                className="mb-2 text-xl font-bold text-foreground sm:text-2xl"
              >
                {t(locale, "auth.resetPassword.invalidToken")}
              </motion.h1>
              {error && (
                <motion.div variants={authFormItemVariants} className="mb-6 form-error">
                  {error}
                </motion.div>
              )}
              <motion.div variants={authFormItemVariants}>
                <Link href="/auth/forgot-password" className="block">
                  <Button variant="primary" size="lg" className="h-12 w-full gap-2 text-base font-semibold">
                    <ArrowLeft className="h-4 w-4" />
                    {t(locale, "auth.forgotPassword.title")}
                  </Button>
                </Link>
              </motion.div>
            </AuthFormCardContent>
          </AuthFormCard>
        </AuthFormColumn>
      </AuthFormPage>
    );
  }

  return (
    <AuthFormPage sidePanel={<ResetPasswordSidePanel />}>
      <AuthFormColumn>
        <AuthFormCard variant="playful">
          <AuthFormCardContent>
            <AuthFormMascot locale={locale} />

            <AuthFormHeader
              title={t(locale, "auth.resetPassword.title")}
              description={t(locale, "auth.resetPassword.description")}
              titleClassName="font-bold"
            />

            <form onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-5 sm:gap-6">
              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}

              <div className="form-group">
                <Label htmlFor="reset-password">
                  {t(locale, "auth.resetPassword.newPassword")}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reset-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder={t(locale, "auth.passwordPlaceholder")}
                    className="form-input-lg form-input-with-icon-left form-input-with-icon-right w-full bg-secondary/50 border-border"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {password.length > 0 && (
                  <div
                    className={`form-hint flex items-center gap-1.5 ${
                      passwordOk ? "text-primary" : ""
                    }`}
                  >
                    <Check className={passwordOk ? "h-3.5 w-3.5" : "h-3.5 w-3.5 opacity-50"} />
                    <span>
                      {locale === "fr" ? "8 caractères minimum" : "At least 8 characters"}
                    </span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="h-12 w-full text-base font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  t(locale, "common.loading")
                ) : (
                  <>
                    {t(locale, "auth.resetPassword.reset")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center gap-1 font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {t(locale, "auth.forgotPasswordPage.backToSignIn")}
                </Link>
              </p>
            </form>
          </AuthFormCardContent>
        </AuthFormCard>
      </AuthFormColumn>
    </AuthFormPage>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">{t("fr", "common.loading")}</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
