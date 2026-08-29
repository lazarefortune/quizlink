"use client";

import { useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignupLegalNotice } from "@/components/legal/signup-legal-notice";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { authFormItemVariants } from "@/lib/auth-motion-variants";
import { startEmailSignupAction } from "./actions";
import { SIGNUP_ERROR_CODES } from "@/lib/auth/signup-error-codes";
import { SignupSidePanel } from "@/components/auth/signup-side-panel";
import { signIn as nextAuthSignIn } from "next-auth/react";
import { resolveSafeCallbackUrl } from "@/lib/auth/safe-callback-url";
import {
  AuthFormCard,
  AuthFormCardContent,
  AuthFormColumn,
  AuthFormDivider,
  AuthFormFooter,
  AuthFormHeader,
  AuthFormLogo,
  AuthFormPage,
} from "@/components/auth/auth-form-layout";
import { ArrowRight } from "lucide-react";
import { GoogleIcon } from "@/components/ui/google-icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mail01Icon } from "@hugeicons/core-free-icons";
import { track } from "@/lib/analytics/track";
import { SIGNUP_STARTED } from "@/lib/analytics/events";
import { markSignupIntentForGoogleOAuth } from "@/lib/observability/signup-intent-client";

function SignUpForm() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const emailSignupStartedRef = useRef(false);
  const googleSignupStartedRef = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLocale();

  const callbackUrl = searchParams.get("callbackUrl");
  const postAuthRedirect = resolveSafeCallbackUrl(callbackUrl);

  const handleGoogleSignUp = () => {
    if (!googleSignupStartedRef.current) {
      googleSignupStartedRef.current = true;
      markSignupIntentForGoogleOAuth();
      track(SIGNUP_STARTED, { method: "google" });
    }
    void nextAuthSignIn("google", { callbackUrl: postAuthRedirect });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    if (!email.trim()) {
      setEmailError(t(locale, "auth.emailRequired"));
      return;
    }

    if (!emailSignupStartedRef.current) {
      emailSignupStartedRef.current = true;
      track(SIGNUP_STARTED, { method: "email" });
    }

    setIsLoading(true);

    try {
      const result = await startEmailSignupAction(email, locale, callbackUrl);
      if (!result.success) {
        if (result.error === SIGNUP_ERROR_CODES.EMAIL_ALREADY_IN_USE) {
          setEmailError(t(locale, "auth.signUp.emailAlreadyInUse"));
          return;
        }
        setEmailError(result.error || t(locale, "auth.signUp.error"));
        return;
      }

      router.push(result.redirectTo);
    } catch {
      setEmailError(t(locale, "auth.signUp.error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthFormPage sidePanel={<SignupSidePanel />}>
      <AuthFormColumn>
        <AuthFormCard>
          <AuthFormCardContent>
            <AuthFormLogo locale={locale} />

            <AuthFormHeader
              title={t(locale, "auth.signUp.title")}
              description={t(locale, "auth.signUp.description")}
              titleClassName="font-fredoka font-semibold"
              className="mb-5 sm:mb-6"
            />

            <motion.div variants={authFormItemVariants} className="flex min-w-0 flex-col gap-3 sm:gap-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-12 w-full gap-3 text-sm font-semibold normal-case tracking-normal sm:text-base [&_svg]:!size-5"
                onClick={handleGoogleSignUp}
              >
                <GoogleIcon className="h-5 w-5 shrink-0" />
                <span className="min-w-0 truncate text-base sm:text-lg">{t(locale, "auth.googleSignIn")}</span>
              </Button>

              <AuthFormDivider>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {t(locale, "auth.orSeparator")}
                </span>
              </AuthFormDivider>
            </motion.div>

            <motion.form
              onSubmit={handleSubmit}
              variants={authFormItemVariants}
              className="flex min-w-0 flex-col gap-4 sm:gap-5"
            >
              <div className="form-group">
                <Label htmlFor="signup-email">{t(locale, "auth.email")}</Label>
                <div className="relative">
                  <HugeiconsIcon icon={Mail01Icon} size={20} className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) {
                        setEmailError(null);
                      }
                    }}
                    required
                    aria-invalid={emailError ? true : undefined}
                    aria-describedby={emailError ? "signup-email-error" : undefined}
                    placeholder={t(locale, "auth.emailPlaceholder")}
                    className="form-input-lg form-input-with-icon-left text-lg w-full bg-secondary/50 border-border"
                  />
                </div>
                {emailError && (
                  <p id="signup-email-error" className="form-error mt-1.5" role="alert">
                    {emailError}
                  </p>
                )}
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
                    {t(locale, "auth.signUp.continue")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.form>

            <SignupLegalNotice className="mt-1 text-center text-pretty text-xs leading-snug text-muted-foreground sm:mt-2" />

            <AuthFormFooter className="mt-6 sm:mt-6 text-base">
              {t(locale, "auth.hasAccount")}{" "}
              <Link
                href={
                  callbackUrl
                    ? `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`
                    : "/auth/signin"
                }
                className="font-semibold text-base text-primary transition-colors hover:text-primary/80"
              >
                {t(locale, "auth.signInLink")}
              </Link>
            </AuthFormFooter>
          </AuthFormCardContent>
        </AuthFormCard>
      </AuthFormColumn>
    </AuthFormPage>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">{t("fr", "common.loading")}</p>
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
