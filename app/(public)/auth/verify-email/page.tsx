"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { verifyEmailAction, resendVerificationCodeAction } from "./actions";
import { useToast } from "@/components/ui/toast";
import { track } from "@/lib/analytics/track";
import { EMAIL_VERIFIED } from "@/lib/analytics/events";
import { buildCommonEventProps } from "@/lib/analytics/props";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale } = useLocale();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

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
        // Small delay to show the toast before redirecting
        setTimeout(() => {
          router.push("/auth/signin?verified=true");
        }, 500);
      } else {
        setError(result.error || t(locale, "auth.verifyEmail.error"));
      }
    } catch (_err) {
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
    } catch (_err) {
      setError(t(locale, "auth.verifyEmail.resendError"));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card variant="playful" className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="mb-6 flex justify-center">
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
          </div>
          <CardHeader className="px-0 pt-0">
            <CardTitle>{t(locale, "auth.verifyEmail.title")}</CardTitle>
            <CardDescription>{t(locale, "auth.verifyEmail.description")}</CardDescription>
          </CardHeader>
          <div className="px-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            {resendSuccess && (
              <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-950/50 rounded-md">
                {t(locale, "auth.verifyEmail.resendSuccess")}
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
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t(locale, "auth.verifyEmail.code")}
              </label>
              <Input
                type="text"
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setCode(value);
                }}
                required
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
              />
              <p className="text-xs text-muted-foreground">
                {t(locale, "auth.verifyEmail.codeHint")}
              </p>
            </div>
            <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
              {isLoading ? t(locale, "common.loading") : t(locale, "auth.verifyEmail.verify")}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="text-sm text-primary hover:underline"
              >
                {isResending
                  ? t(locale, "common.loading")
                  : t(locale, "auth.verifyEmail.resend")}
              </button>
            </div>
          </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card variant="playful" className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center">{t("fr", "common.loading")}</p>
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
