"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { authFormItemVariants } from "@/lib/auth-motion-variants";
import {
  verifyEmailAction,
  resendVerificationCodeAction,
  getVerifyEmailStatusAction,
} from "./actions";
import { track } from "@/lib/analytics/track";
import { EMAIL_VERIFIED } from "@/lib/analytics/events";
import { buildCommonEventProps } from "@/lib/analytics/props";
import {
  buildSignInHref,
  buildSignUpHref,
} from "@/lib/auth/safe-callback-url";
import { useToast } from "@/components/ui/toast";
import { VerifyEmailSidePanel } from "@/components/auth/verify-email-side-panel";
import { VerificationCodeInput } from "@/components/auth/verification-code-input";
import {
  AuthFormCard,
  AuthFormCardContent,
  AuthFormColumn,
  AuthFormHeader,
  AuthFormMascot,
  AuthFormPage,
} from "@/components/auth/auth-form-layout";
import { ArrowRight } from "lucide-react";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale } = useLocale();
  const { showToast } = useToast();
  const hasShownCreatedToast = useRef(false);

  const email = searchParams.get("email") ?? "";
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isAlreadyVerified, setIsAlreadyVerified] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl");
  const accountJustCreated = searchParams.get("created") === "true";
  const signInHref = buildSignInHref(callbackUrl, { verified: true, email: email || undefined });
  const signUpHref = buildSignUpHref(callbackUrl);

  useEffect(() => {
    if (!accountJustCreated || hasShownCreatedToast.current) {
      return;
    }
    hasShownCreatedToast.current = true;
    showToast(t(locale, "auth.signUp.accountCreated"), "success");
  }, [accountJustCreated, locale, showToast]);

  useEffect(() => {
    if (!email) {
      return;
    }

    let isCancelled = false;

    getVerifyEmailStatusAction(email).then((status) => {
      if (!isCancelled) {
        setIsAlreadyVerified(status.isVerified);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [email]);

  const isVerifiedAccount = Boolean(email) && isAlreadyVerified;

  const pageDescription = (() => {
    if (!email) {
      return t(locale, "auth.verifyEmail.description");
    }
    if (isVerifiedAccount) {
      return t(locale, "auth.verifyEmail.alreadyVerified");
    }
    return t(locale, "auth.verifyEmail.codeSentTo").replace("{email}", email);
  })();

  const redirectToSignIn = (redirectTo: string) => {
    setIsRedirecting(true);
    setTimeout(() => {
      router.push(redirectTo);
    }, 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
      const result = await verifyEmailAction(email, code, callbackUrl);
      if (!result.success) {
        setError(result.error || t(locale, "auth.verifyEmail.error"));
        return;
      }

      if (!result.alreadyVerified) {
        track(EMAIL_VERIFIED, {
          ...buildCommonEventProps({ preferredLanguage: locale }),
          method: "code",
        });
      }

      redirectToSignIn(result.redirectTo);
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

    try {
      const result = await resendVerificationCodeAction(email, locale);
      if (result.success) {
        if ("alreadyVerified" in result && result.alreadyVerified) {
          setIsAlreadyVerified(true);
        } else {
          showToast(t(locale, "auth.verifyEmail.resendSuccess"), "success");
        }
      } else {
        setError(result.error || t(locale, "auth.verifyEmail.resendError"));
      }
    } catch {
      setError(t(locale, "auth.verifyEmail.resendError"));
    } finally {
      setIsResending(false);
    }
  };

  const isBusy = isLoading || isRedirecting;

  return (
    <AuthFormPage sidePanel={<VerifyEmailSidePanel />}>
      <AuthFormColumn>
        <AuthFormCard>
          <AuthFormCardContent>
            <AuthFormMascot locale={locale} size="compact" />

            <AuthFormHeader
              align="center-mobile"
              className="mb-5 sm:mb-6"
              titleClassName="font-semibold"
              title={t(locale, "auth.verifyEmail.title")}
              description={
                <>
                  <p>{pageDescription}</p>
                  {email && !isVerifiedAccount && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t(locale, "auth.verifyEmail.notYourEmail")}{" "}
                      <Link
                        href={signUpHref}
                        className="font-medium text-primary underline-offset-2 hover:underline"
                      >
                        {t(locale, "auth.verifyEmail.backToSignUp")}
                      </Link>
                    </p>
                  )}
                </>
              }
            />

            <motion.div variants={authFormItemVariants} className="flex min-w-0 flex-col gap-4">
              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}

              {isVerifiedAccount ? (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="h-12 w-full"
                  disabled={isBusy || !email}
                  onClick={() => redirectToSignIn(signInHref)}
                >
                  {isRedirecting ? (
                    t(locale, "auth.verifyEmail.verifiedRedirecting")
                  ) : (
                    <>
                      {t(locale, "auth.verifyEmail.continueToSignIn")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : (
                <form onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-4">
                  <div className="form-group min-w-0">
                    <Label id="verify-code-label" className="sr-only">
                      {t(locale, "auth.verifyEmail.code")}
                    </Label>
                    <VerificationCodeInput
                      id="verify-code"
                      value={code}
                      onChange={setCode}
                      disabled={isBusy || !email}
                      aria-label={t(locale, "auth.verifyEmail.code")}
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="h-12 w-full"
                    disabled={isBusy || !email}
                  >
                    {isBusy ? (
                      isRedirecting
                        ? t(locale, "auth.verifyEmail.verifiedRedirecting")
                        : t(locale, "common.loading")
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
                      disabled={isResending || !email || isBusy}
                      className="text-primary underline-offset-2 hover:underline disabled:opacity-50"
                    >
                      {isResending
                        ? t(locale, "common.loading")
                        : t(locale, "auth.verifyEmail.resend")}
                    </button>
                  </p>
                </form>
              )}
            </motion.div>
          </AuthFormCardContent>
        </AuthFormCard>
      </AuthFormColumn>
    </AuthFormPage>
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
