"use client";

import { useState, Suspense } from "react";
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
import { signUpAction } from "./actions";
import { SignupSidePanel } from "@/components/auth/signup-side-panel";
import { track } from "@/lib/analytics/track";
import { SIGNUP_COMPLETED } from "@/lib/analytics/events";
import { buildCommonEventProps } from "@/lib/analytics/props";
import { signIn as nextAuthSignIn } from "next-auth/react";
import { buildVerifyEmailHref, resolveSafeCallbackUrl } from "@/lib/auth/safe-callback-url";
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
import { Eye, EyeOff, ArrowRight, Mail, Lock, User, Check } from "lucide-react";
import { GoogleIcon } from "@/components/ui/google-icon";

function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLocale();

  const callbackUrl = searchParams.get("callbackUrl");
  const postAuthRedirect = resolveSafeCallbackUrl(callbackUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(t(locale, "auth.nameRequired"));
      return;
    }

    if (password.length < 8) {
      setError(t(locale, "auth.passwordTooShort"));
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUpAction(name.trim(), email, password, locale);
      if (!result.success) {
        setError(result.error || t(locale, "auth.signUp.error"));
        return;
      }

      track(SIGNUP_COMPLETED, {
        ...buildCommonEventProps({ preferredLanguage: locale }),
        from_page: "signup",
        language: locale === "fr" || locale === "en" ? locale : "fr",
      });

      const verifyEmailPath = buildVerifyEmailHref(
        result.email ?? email,
        callbackUrl,
        { created: true },
      );
      router.push(verifyEmailPath);
    } catch {
      setError(t(locale, "auth.signUp.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const passwordOk = password.length >= 8;

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
                variant="white"
                size="lg"
                className="h-12 w-full gap-3 text-sm font-semibold sm:text-base [&_svg]:!size-5"
                onClick={() =>
                  nextAuthSignIn("google", { callbackUrl: postAuthRedirect })
                }
              >
                <GoogleIcon className="h-5 w-5 shrink-0" />
                <span className="min-w-0 truncate">{t(locale, "auth.googleSignUp")}</span>
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
              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}

              <div className="form-group">
                <Label htmlFor="signup-name">
                  {t(locale, "auth.name")}
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="signup-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder={t(locale, "auth.namePlaceholder")}
                    className="form-input-lg text-base form-input-with-icon-left w-full bg-secondary/50 border-border"
                  />
                </div>
              </div>

              <div className="form-group">
                <Label htmlFor="signup-email">{t(locale, "auth.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={t(locale, "auth.emailPlaceholder")}
                    className="form-input-lg form-input-with-icon-left w-full bg-secondary/50 border-border"
                  />
                </div>
              </div>

              <div className="form-group">
                <Label htmlFor="signup-password">{t(locale, "auth.password")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="signup-password"
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
                className="h-12 w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  t(locale, "common.loading")
                ) : (
                  <>
                    {t(locale, "auth.signUp.button")}
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
