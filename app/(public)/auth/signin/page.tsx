"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn as nextAuthSignIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { authFormItemVariants } from "@/lib/auth-motion-variants";
import { checkEmailVerified } from "./actions";
import {
  buildSignInHref,
  buildVerifyEmailHref,
  resolveSafeCallbackUrl,
} from "@/lib/auth/safe-callback-url";
import { useToast } from "@/components/ui/toast";
import { SigninSidePanel } from "@/components/auth/signin-side-panel";
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
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { GoogleIcon } from "@/components/ui/google-icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mail01Icon, LockOpen, EyeIcon, EyeOffIcon } from "@hugeicons/core-free-icons";
import { clearSignupIntentCookie } from "@/lib/observability/signup-intent-client";

function SignInForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale } = useLocale();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl");
  const postAuthRedirect = resolveSafeCallbackUrl(callbackUrl);

  useEffect(() => {
    // Avoid misclassifying a later Google login after an abandoned signup OAuth.
    clearSignupIntentCookie();
  }, []);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const verified = searchParams.get("verified");

    if (verified === "true") {
      showToast(t(locale, "auth.signIn.emailVerified"), "success");
      router.replace(buildSignInHref(callbackUrl, { email: searchParams.get("email") }));
    }
  }, [searchParams, locale, showToast, router, callbackUrl]);

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
        const emailCheck = await checkEmailVerified(email);
        if (emailCheck.exists && !emailCheck.verified) {
          setError(t(locale, "auth.signIn.emailNotVerified"));
          router.push(
            buildVerifyEmailHref(email, callbackUrl, { requiresVerification: true }),
          );
          return;
        }
        setError(t(locale, "auth.signIn.invalidCredentials"));
      } else {
        router.push(postAuthRedirect);
        router.refresh();
      }
    } catch {
      setError(t(locale, "auth.signIn.error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthFormPage sidePanel={<SigninSidePanel />}>
      <AuthFormColumn>
        <AuthFormCard>
          <AuthFormCardContent>
            <AuthFormLogo locale={locale} />

            <AuthFormHeader
              title={t(locale, "auth.signIn.title")}
              description={t(locale, "auth.signIn.description")}
              titleClassName="font-fredoka font-black"
            />

            <motion.div variants={authFormItemVariants} className="flex min-w-0 flex-col gap-3 sm:gap-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-12 w-full gap-3 text-sm font-semibold normal-case tracking-normal sm:text-base [&_svg]:!size-5"
                onClick={() => nextAuthSignIn("google", { callbackUrl: postAuthRedirect })}
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
              className="flex min-w-0 flex-col gap-5 sm:gap-6"
            >
              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}

              <div className="form-group">
                <Label htmlFor="signin-email">{t(locale, "auth.email")}</Label>
                <div className="relative">
                  <HugeiconsIcon icon={Mail01Icon} size={20} className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={t(locale, "auth.emailPlaceholder")}
                    className="form-input-lg form-input-with-icon-left text-lg w-full bg-secondary/50 border-border"
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <Label htmlFor="signin-password" className="shrink-0">
                    {t(locale, "auth.password")}
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="shrink-0 text-sm font-medium text-primary transition-colors hover:text-primary/80 sm:text-base"
                  >
                    {t(locale, "auth.forgotPassword")}
                  </Link>
                </div>
                <div className="relative">
                  <HugeiconsIcon icon={LockOpen} size={20} className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="signin-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder={t(locale, "auth.passwordPlaceholder")}
                    className="form-input-lg form-input-with-icon-left form-input-with-icon-right text-lg w-full bg-secondary/50 border-border"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? (
                      <HugeiconsIcon icon={EyeOffIcon} size={20} className="text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
                    ) : (
                      <HugeiconsIcon icon={EyeIcon} size={20} className="text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </button>
                </div>
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
                    {t(locale, "auth.signIn.button")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.form>

            <AuthFormFooter className="text-base">
              {t(locale, "auth.noAccount")}{" "}
              <Link
                href="/auth/signup"
                className="font-semibold text-primary transition-colors hover:text-primary/80"
              >
                {t(locale, "auth.signUpLink")}
              </Link>
            </AuthFormFooter>
          </AuthFormCardContent>
        </AuthFormCard>
      </AuthFormColumn>
    </AuthFormPage>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">{t("fr", "common.loading")}</p>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
