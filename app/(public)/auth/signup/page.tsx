"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import {
  authFormContainerVariants,
  authFormItemVariants,
} from "@/lib/auth-motion-variants";
import { signUpAction } from "./actions";
import { SignupSidePanel } from "@/components/auth/signup-side-panel";
import { track } from "@/lib/analytics/track";
import { SIGNUP_COMPLETED } from "@/lib/analytics/events";
import { buildCommonEventProps } from "@/lib/analytics/props";
import { signIn as nextAuthSignIn } from "next-auth/react";
import { Eye, EyeOff, ArrowRight, Mail, Lock, User, Check } from "lucide-react";
import { GoogleIcon } from "@/components/ui/google-icon";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { locale } = useLocale();

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

    if (!legalAccepted) {
      setError(t(locale, "auth.signUp.legalRequiredError"));
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUpAction(name.trim(), email, password, legalAccepted, locale);
      if (result.success) {
        track(SIGNUP_COMPLETED, {
          ...buildCommonEventProps({ preferredLanguage: locale }),
          from_page: "signup",
          language: locale === "fr" || locale === "en" ? locale : "fr",
        });
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        setError(result.error || t(locale, "auth.signUp.error"));
      }
    } catch {
      setError(t(locale, "auth.signUp.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const passwordOk = password.length >= 8;

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
          <Card>
            <CardContent className="pt-6">
              {/* Mascotte — clic = retour accueil */}
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

              {/* En-tête */}
              <motion.div
                variants={authFormItemVariants}
                className="mb-6 flex flex-col gap-2"
              >
                <h1 className="font-heading text-3xl font-fredoka font-black tracking-tight text-foreground text-balance">
                  {t(locale, "auth.signUp.title")}
                </h1>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {t(locale, "auth.signUp.description")}
                </p>
              </motion.div>

              {/* Google sign-up */}
              <motion.div variants={authFormItemVariants} className="flex flex-col gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-12 w-full gap-3"
                  onClick={() => nextAuthSignIn("google", { callbackUrl: "/dashboard" })}
                >
                  <GoogleIcon className="h-5 w-5" />
                  {t(locale, "auth.googleSignUp")}
                </Button>

                <div className="relative flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">{t(locale, "auth.orSeparator")}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              </motion.div>

              <motion.form
                onSubmit={handleSubmit}
                variants={authFormItemVariants}
                className="flex flex-col gap-5"
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
                      className="form-input-lg form-input-with-icon-left bg-secondary/50 border-border"
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
                      className="form-input-lg form-input-with-icon-left bg-secondary/50 border-border"
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

                <div className="flex gap-3 rounded-lg border border-border/60 bg-secondary/30 p-3">
                  <Checkbox
                    id="signup-legal"
                    checked={legalAccepted}
                    onCheckedChange={setLegalAccepted}
                    aria-required="true"
                    className="mt-0.5 shrink-0"
                  />
                  <Label
                    htmlFor="signup-legal"
                    className="cursor-pointer text-sm font-normal leading-snug text-foreground"
                  >
                    {t(locale, "auth.signUp.legalIntro")}
                    <Link
                      href="/legal/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-primary underline-offset-2 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t(locale, "auth.signUp.legalTermsLink")}
                    </Link>
                    {t(locale, "auth.signUp.legalMid")}
                    <Link
                      href="/legal/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-primary underline-offset-2 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t(locale, "auth.signUp.legalPrivacyLink")}
                    </Link>
                    {t(locale, "auth.signUp.legalEnd")}
                  </Label>
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

              <motion.p
                variants={authFormItemVariants}
                className="mt-6 text-center text-base text-muted-foreground"
              >
                {t(locale, "auth.hasAccount")}{" "}
                <Link
                  href="/auth/signin"
                  className="font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  {t(locale, "auth.signInLink")}
                </Link>
              </motion.p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Right — panneau latéral */}
      <div className="hidden lg:block lg:w-1/2">
        <SignupSidePanel />
      </div>
    </div>
  );
}
