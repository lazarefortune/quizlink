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
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import {
  authFormContainerVariants,
  authFormItemVariants,
} from "@/lib/auth-motion-variants";
import { signUpAction } from "./actions";
import { SignupSidePanel } from "@/components/auth/signup-side-panel";
import { Eye, EyeOff, ArrowRight, Mail, Lock, User, Check } from "lucide-react";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

    setIsLoading(true);

    try {
      const result = await signUpAction(name.trim(), email, password, locale);
      if (result.success) {
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
                      src="/mascot.jpg"
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
                <h1 className="font-heading text-3xl font-nunito font-black tracking-tight text-foreground text-balance">
                  {t(locale, "auth.signUp.title")}
                </h1>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {t(locale, "auth.signUp.description")}
                </p>
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
                    {t(locale, "auth.name")} <span className="text-destructive">*</span>
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
                className="mt-6 text-center text-sm text-muted-foreground"
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
