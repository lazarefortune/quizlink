"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { authFormItemVariants } from "@/lib/auth-motion-variants";
import { requestPasswordResetAction } from "../reset-password/actions";
import { ForgotPasswordSidePanel } from "@/components/auth/forgot-password-side-panel";
import {
  AuthFormCard,
  AuthFormCardContent,
  AuthFormColumn,
  AuthFormHeader,
  AuthFormMascot,
  AuthFormPage,
} from "@/components/auth/auth-form-layout";
import { ArrowLeft, ArrowRight, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { locale } = useLocale();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSuccess(false);
    setIsLoading(true);

    try {
      const result = await requestPasswordResetAction(email, locale);
      if (result.success) {
        setIsSuccess(true);
      } else {
        setError(result.error || t(locale, "auth.forgotPasswordPage.error"));
      }
    } catch {
      setError(t(locale, "auth.forgotPasswordPage.error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthFormPage sidePanel={<ForgotPasswordSidePanel />}>
      <AuthFormColumn>
        <AuthFormCard>
          <AuthFormCardContent>
            <AuthFormMascot locale={locale} />

            {!isSuccess && (
              <AuthFormHeader
                title={t(locale, "auth.forgotPasswordPage.title")}
                description={t(locale, "auth.forgotPasswordPage.description")}
                titleClassName="font-bold"
              />
            )}

            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="flex min-w-0 flex-col gap-6 text-center"
              >
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-lg font-semibold text-foreground">
                    {t(locale, "auth.forgotPasswordPage.success")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {locale === "fr"
                      ? "Vérifie ta boîte de réception et suis les instructions pour réinitialiser ton mot de passe."
                      : "Check your inbox and follow the instructions to reset your password."}
                  </p>
                </div>
                <Link href="/auth/signin">
                  <Button
                    variant="primary"
                    size="lg"
                    className="h-12 w-full gap-2 text-base font-semibold"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {t(locale, "auth.forgotPasswordPage.backToSignIn")}
                  </Button>
                </Link>
              </motion.div>
            ) : (
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
                  <Label htmlFor="forgot-email">
                    {t(locale, "auth.email")}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder={t(locale, "auth.emailPlaceholder")}
                      className="form-input-lg form-input-with-icon-left w-full bg-secondary/50 border-border"
                    />
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
                      {t(locale, "auth.forgotPasswordPage.send")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  <Link
                    href="/auth/signin"
                    className="inline-flex items-center gap-1 font-semibold text-primary transition-colors hover:text-primary/80"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    {t(locale, "auth.forgotPasswordPage.backToSignIn")}
                  </Link>
                </p>
              </motion.form>
            )}
          </AuthFormCardContent>
        </AuthFormCard>
      </AuthFormColumn>
    </AuthFormPage>
  );
}
