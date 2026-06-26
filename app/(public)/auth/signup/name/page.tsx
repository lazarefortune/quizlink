"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { authFormItemVariants } from "@/lib/auth-motion-variants";
import { getSignupStepAccessAction, saveSignupNameAction } from "../actions";
import { SignupSidePanel } from "@/components/auth/signup-side-panel";
import {
  AuthFormCard,
  AuthFormCardContent,
  AuthFormColumn,
  AuthFormHeader,
  AuthFormLogo,
  AuthFormPage,
} from "@/components/auth/auth-form-layout";
import { ArrowRight, User } from "lucide-react";

function SignupNameForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale } = useLocale();

  const email = searchParams.get("email") ?? "";
  const callbackUrl = searchParams.get("callbackUrl");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    if (!email) {
      router.replace("/auth/signup");
      return;
    }

    let isCancelled = false;

    getSignupStepAccessAction(email, "name", callbackUrl).then((access) => {
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

    if (!name.trim()) {
      setError(t(locale, "auth.nameRequired"));
      return;
    }

    setIsLoading(true);

    try {
      const result = await saveSignupNameAction(email, name.trim(), callbackUrl);
      if (!result.success) {
        setError(result.error || t(locale, "auth.signUp.error"));
        return;
      }

      router.push(result.redirectTo);
    } catch {
      setError(t(locale, "auth.signUp.error"));
    } finally {
      setIsLoading(false);
    }
  };

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
              title={t(locale, "auth.signUp.nameStep.title")}
              description={t(locale, "auth.signUp.nameStep.description")}
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
                <Label htmlFor="signup-name-step">{t(locale, "auth.name")}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="signup-name-step"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                    placeholder={t(locale, "auth.namePlaceholder")}
                    className="form-input-lg text-base form-input-with-icon-left w-full bg-secondary/50 border-border"
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
                    {t(locale, "auth.signUp.continue")}
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

export default function SignupNamePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">{t("fr", "common.loading")}</p>
        </div>
      }
    >
      <SignupNameForm />
    </Suspense>
  );
}
