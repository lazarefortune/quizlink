"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn as nextAuthSignIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { authFormItemVariants } from "@/lib/auth-motion-variants";
import { completeSignupAction, getSignupStepAccessAction } from "../actions";
import { SIGNUP_ERROR_CODES } from "@/lib/auth/signup-error-codes";
import { SignupSidePanel } from "@/components/auth/signup-side-panel";
import { track } from "@/lib/analytics/track";
import { SIGNUP_COMPLETED } from "@/lib/analytics/events";
import { buildCommonEventProps } from "@/lib/analytics/props";
import {
  AuthFormCard,
  AuthFormCardContent,
  AuthFormColumn,
  AuthFormHeader,
  AuthFormLogo,
  AuthFormPage,
} from "@/components/auth/auth-form-layout";
import { ArrowRight, Lock, Eye, EyeOff, Check } from "lucide-react";

function SignupPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale } = useLocale();

  const email = searchParams.get("email") ?? "";
  const callbackUrl = searchParams.get("callbackUrl");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    if (!email) {
      router.replace("/auth/signup");
      return;
    }

    let isCancelled = false;

    getSignupStepAccessAction(email, "password", callbackUrl).then((access) => {
      if (isCancelled) {
        return;
      }
      if (!access.allowed) {
        router.replace(access.redirectTo);
        return;
      }
      setIsCheckingAccess(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [email, callbackUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t(locale, "auth.passwordTooShort"));
      return;
    }

    setIsLoading(true);

    try {
      const result = await completeSignupAction(email, password, callbackUrl);
      if (!result.success) {
        if (result.error === SIGNUP_ERROR_CODES.EMAIL_ALREADY_IN_USE) {
          setError(t(locale, "auth.signUp.emailAlreadyInUse"));
          return;
        }
        setError(result.error || t(locale, "auth.signUp.error"));
        return;
      }

      track(SIGNUP_COMPLETED, {
        ...buildCommonEventProps({ preferredLanguage: locale }),
        from_page: "signup_password",
        language: locale === "fr" || locale === "en" ? locale : "fr",
      });

      const signInResult = await nextAuthSignIn("credentials", {
        email: result.email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError(t(locale, "auth.signIn.error"));
        return;
      }

      router.push(result.redirectTo);
      router.refresh();
    } catch {
      setError(t(locale, "auth.signUp.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const passwordOk = password.length >= 8;

  if (isCheckingAccess) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">{t(locale, "common.loading")}</p>
      </div>
    );
  }

  return (
    <AuthFormPage sidePanel={<SignupSidePanel />}>
      <AuthFormColumn>
        <AuthFormCard>
          <AuthFormCardContent>
            <AuthFormLogo locale={locale} />

            <AuthFormHeader
              title={t(locale, "auth.signUp.passwordStep.title")}
              description={t(locale, "auth.signUp.passwordStep.description")}
              titleClassName="font-fredoka font-semibold"
              className="mb-5 sm:mb-6"
            />

            <motion.form
              onSubmit={handleSubmit}
              variants={authFormItemVariants}
              className="flex min-w-0 flex-col gap-4 sm:gap-5"
            >
              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}

              <div className="form-group">
                <Label htmlFor="signup-password-step">{t(locale, "auth.password")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="signup-password-step"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoFocus
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
                className="h-12 w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  t(locale, "common.loading")
                ) : (
                  <>
                    {t(locale, "auth.signUp.passwordStep.button")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.form>
          </AuthFormCardContent>
        </AuthFormCard>
      </AuthFormColumn>
    </AuthFormPage>
  );
}

export default function SignupPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">{t("fr", "common.loading")}</p>
        </div>
      }
    >
      <SignupPasswordForm />
    </Suspense>
  );
}
