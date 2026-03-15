"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import {
  authFormContainerVariants,
  authFormItemVariants,
} from "@/lib/auth-motion-variants";
import { resetPasswordAction, validateResetTokenAction } from "./actions";
import { ResetPasswordSidePanel } from "@/components/auth/reset-password-side-panel";
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
      <div className="flex min-h-[calc(100vh-3.5rem)] w-full flex-col lg:flex-row">
        <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
          <motion.div
            className="mx-auto w-full max-w-md text-center"
            variants={authFormContainerVariants}
            initial="hidden"
            animate="show"
          >
            <Card>
              <CardContent className="pt-6">
                <motion.div
                  variants={authFormItemVariants}
                  className="mb-8 flex justify-center"
                >
                  <Link
                    href="/"
                    className="inline-block rounded-full transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
                    aria-label={locale === "fr" ? "Retour à l'accueil" : "Back to home"}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                      className="relative h-24 w-24 drop-shadow-md"
                    >
                      <Image
                        src="/mascot.jpg"
                        alt="QuizLink mascotte"
                        fill
                        className="object-contain"
                        sizes="96px"
                      />
                    </motion.div>
                  </Link>
                </motion.div>
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
              </CardContent>
            </Card>
          </motion.div>
        </div>
        <div className="hidden lg:block lg:w-1/2">
          <ResetPasswordSidePanel />
        </div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] w-full flex-col lg:flex-row">
        <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
          <motion.div
            className="mx-auto w-full max-w-md text-center"
            variants={authFormContainerVariants}
            initial="hidden"
            animate="show"
          >
            <Card variant="playful">
              <CardContent className="pt-6">
                <motion.div
                  variants={authFormItemVariants}
                  className="mb-8 flex justify-center"
                >
                  <Link
                    href="/"
                    className="inline-block rounded-full transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
                    aria-label={locale === "fr" ? "Retour à l'accueil" : "Back to home"}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                      className="relative h-24 w-24 drop-shadow-md"
                    >
                      <Image
                        src="/mascot.jpg"
                        alt="QuizLink mascotte"
                        fill
                        className="object-contain"
                        sizes="96px"
                      />
                    </motion.div>
                  </Link>
                </motion.div>
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
              </CardContent>
            </Card>
          </motion.div>
        </div>
        <div className="hidden lg:block lg:w-1/2">
          <ResetPasswordSidePanel />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] w-full flex-col lg:flex-row">
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        <motion.div
          className="mx-auto w-full max-w-md"
          variants={authFormContainerVariants}
          initial="hidden"
          animate="show"
        >
          <Card variant="playful">
            <CardContent className="pt-6">
              <motion.div
                variants={authFormItemVariants}
                className="mb-8 flex justify-center"
              >
                <Link
                  href="/"
                  className="inline-block rounded-full transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
                  aria-label={locale === "fr" ? "Retour à l'accueil" : "Back to home"}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="relative h-24 w-24 drop-shadow-md"
                  >
                    <Image
                      src="/mascot.jpg"
                      alt="QuizLink mascotte"
                      fill
                      className="object-contain"
                      sizes="96px"
                    />
                  </motion.div>
                </Link>
              </motion.div>

              <motion.div
                variants={authFormItemVariants}
                className="mb-8 flex flex-col gap-2"
              >
                <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground text-balance">
                  {t(locale, "auth.resetPassword.title")}
                </h1>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {t(locale, "auth.resetPassword.description")}
                </p>
              </motion.div>

              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-6"
              >
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
                      className="form-input-lg form-input-with-icon-left form-input-with-icon-right bg-secondary/50 border-border"
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
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="hidden lg:block lg:w-1/2">
        <ResetPasswordSidePanel />
      </div>
    </div>
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
