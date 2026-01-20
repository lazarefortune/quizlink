"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import Link from "next/link";
import { signUpAction } from "./actions";
import { Eye, EyeOff } from "lucide-react";

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
        // Redirect to verification page with email
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        setError(result.error || t(locale, "auth.signUp.error"));
      }
    } catch (err) {
      setError(t(locale, "auth.signUp.error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t(locale, "auth.signUp.title")}</CardTitle>
          <CardDescription>{t(locale, "auth.signUp.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t(locale, "auth.name")} *
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder={t(locale, "auth.namePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t(locale, "auth.email")}
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={t(locale, "auth.emailPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t(locale, "auth.password")}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={t(locale, "auth.passwordPlaceholder")}
                  minLength={8}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
              {isLoading ? t(locale, "common.loading") : t(locale, "auth.signUp.button")}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              {t(locale, "auth.hasAccount")}{" "}
              <Link href="/auth/signin" className="text-primary hover:underline">
                {t(locale, "auth.signInLink")}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
