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
import { verifyEmailAction, resendVerificationCodeAction } from "./actions";
import { useToast } from "@/components/ui/toast";
import { track } from "@/lib/analytics/track";
import { EMAIL_VERIFIED } from "@/lib/analytics/events";
import { buildCommonEventProps } from "@/lib/analytics/props";
import { buildSignInHref } from "@/lib/auth/safe-callback-url";
import { VerifyEmailSidePanel } from "@/components/auth/verify-email-side-panel";
import { VerificationCodeInput } from "@/components/auth/verification-code-input";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale } = useLocale();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl");
  const accountJustCreated = searchParams.get("created") === "true";
  const requiresVerification = searchParams.get("requiresVerification") === "true";
  const signInHref = buildSignInHref(callbackUrl);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (accountJustCreated) {
      setInfoMessage(t(locale, "auth.signUp.accountCreated"));
      return;
    }

    if (requiresVerification) {
      setInfoMessage(t(locale, "auth.signIn.emailNotVerified"));
    }
  }, [accountJustCreated, requiresVerification, locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResendSuccess(false);

    if (!email) {
      setError(t(locale, "auth.verifyEmail.emailRequired"));
      return;
    }

    if (code.length !== 6) {
      setError(t(locale, "auth.verifyEmail.codeLength"));
      return;
    }

    setIsLoading(true);

    try {
      const result = await verifyEmailAction(email, code);
      if (result.success) {
        track(EMAIL_VERIFIED, {
          ...buildCommonEventProps({ preferredLanguage: locale }),
          method: "code",
        });
        showToast(t(locale, "auth.verifyEmail.success"), "success");
        setTimeout(() => {
          router.push(buildSignInHref(callbackUrl, true));
        }, 500);
      } else {
        setError(result.error || t(locale, "auth.verifyEmail.error"));
      }
    } catch {
      setError(t(locale, "auth.verifyEmail.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError(t(locale, "auth.verifyEmail.emailRequired"));
      return;
    }

    setIsResending(true);
    setError(null);
    setResendSuccess(false);

    try {
      const result = await resendVerificationCodeAction(email, locale);
      if (result.success) {
        setResendSuccess(true);
      } else {
        setError(result.error || t(locale, "auth.verifyEmail.resendError"));
      }
    } catch {
      setError(t(locale, "auth.verifyEmail.resendError"));
    } finally {
      setIsResending(false);
    }
  };

  const description = email
    ? t(locale, "auth.verifyEmail.descriptionWithEmail").replace("{email}", email)
    : t(locale, "auth.verifyEmail.description");

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] w-full flex-col lg:flex-row">
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        <motion.div
          className="mx-auto w-full max-w-md"
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
                      src="/mascotte.png"
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
                className="mb-6 flex flex-col gap-2"
              >
                <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground text-balance">
                  {t(locale, "auth.verifyEmail.title")}
                </h1>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </motion.div>

              <motion.form
                onSubmit={handleSubmit}
                variants={authFormItemVariants}
                className="flex flex-col gap-5"
              >
                {infoMessage && (
                  <div
                    className="rounded-md bg-primary/10 p-3 text-sm text-primary"
                    role="status"
                  >
                    {infoMessage}
                  </div>
                )}

                {error && (
                  <div className="form-error" role="alert">
                    {error}
                  </div>
                )}

                {resendSuccess && (
                  <div
                    className="rounded-md bg-green-50 p-3 text-sm text-green-600 dark:bg-green-950/50"
                    role="status"
                  >
                    {t(locale, "auth.verifyEmail.resendSuccess")}
                  </div>
                )}

                <div className="form-group">
                  <Label htmlFor="verify-email">{t(locale, "auth.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="verify-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder={t(locale, "auth.emailPlaceholder")}
                      className="form-input-lg form-input-with-icon-left bg-secondary/50 border-border"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <Label id="verify-code-label">{t(locale, "auth.verifyEmail.code")}</Label>
                  <VerificationCodeInput
                    id="verify-code"
                    value={code}
                    onChange={setCode}
                    disabled={isLoading}
                    aria-label={t(locale, "auth.verifyEmail.code")}
                  />
                  <p className="form-hint text-center sm:text-left">
                    {t(locale, "auth.verifyEmail.codeHint")}
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="h-12 w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    t(locale, "common.loading")
                  ) : (
                    <>
                      {t(locale, "auth.verifyEmail.verify")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="font-semibold text-primary transition-colors hover:text-primary/80 disabled:opacity-50"
                  >
                    {isResending
                      ? t(locale, "common.loading")
                      : t(locale, "auth.verifyEmail.resend")}
                  </button>
                </p>

                <p className="text-center text-sm text-muted-foreground">
                  <Link
                    href={signInHref}
                    className="inline-flex items-center gap-1 font-semibold text-primary transition-colors hover:text-primary/80"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    {t(locale, "auth.forgotPasswordPage.backToSignIn")}
                  </Link>
                </p>
              </motion.form>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="hidden lg:block lg:w-1/2">
        <VerifyEmailSidePanel />
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">{t("fr", "common.loading")}</p>
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
