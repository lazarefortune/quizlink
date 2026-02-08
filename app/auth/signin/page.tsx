"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn as nextAuthSignIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import {
  authFormContainerVariants,
  authFormItemVariants,
} from "@/lib/auth-motion-variants";
import { checkEmailVerified } from "./actions";
import { useToast } from "@/components/ui/toast";
import { SigninSidePanel } from "@/components/auth/signin-side-panel";
import { ArrowRight, Mail, Lock, Eye, EyeOff } from "lucide-react";

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

  useEffect(() => {
    const verified = searchParams.get("verified");
    if (verified === "true") {
      showToast(t(locale, "auth.verifyEmail.success"), "success");
      router.replace("/auth/signin");
    }
  }, [searchParams, locale, showToast, router]);

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
          router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
          return;
        }
        setError(t(locale, "auth.signIn.invalidCredentials"));
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError(t(locale, "auth.signIn.error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] w-full flex-col lg:flex-row">
      {/* Left — formulaire */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        <motion.div
          className="mx-auto w-full max-w-md"
          variants={authFormContainerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Logo */}
          <motion.div variants={authFormItemVariants} className="mb-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
              aria-label={locale === "fr" ? "Retour à l'accueil" : "Back to home"}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <span className="font-heading text-lg font-bold text-primary-foreground">Q</span>
              </div>
              <span className="text-2xl font-bold tracking-tight text-foreground">
                Quiz<span className="text-primary">Link</span>
              </span>
            </Link>
          </motion.div>

          {/* En-tête */}
          <motion.div
            variants={authFormItemVariants}
            className="mb-8 flex flex-col gap-2"
          >
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground text-balance">
              {t(locale, "auth.signIn.title")}
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t(locale, "auth.signIn.description")}
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            variants={authFormItemVariants}
            className="flex flex-col gap-6"
          >
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}

            <div className="form-group">
              <Label htmlFor="signin-email">{t(locale, "auth.email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="signin-email"
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
              <div className="flex items-center justify-between">
                <Label htmlFor="signin-password">{t(locale, "auth.password")}</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
                >
                  {t(locale, "auth.forgotPassword")}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
                  {t(locale, "auth.signIn.button")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </motion.form>

          <motion.p
            variants={authFormItemVariants}
            className="mt-8 text-center text-sm text-muted-foreground"
          >
            {t(locale, "auth.noAccount")}{" "}
            <Link
              href="/auth/signup"
              className="font-semibold text-primary transition-colors hover:text-primary/80"
            >
              {t(locale, "auth.signUpLink")}
            </Link>
          </motion.p>
        </motion.div>
      </div>

      {/* Right — panneau latéral */}
      <div className="hidden lg:block lg:w-1/2">
        <SigninSidePanel />
      </div>
    </div>
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
