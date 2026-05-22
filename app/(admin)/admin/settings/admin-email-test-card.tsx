"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  ADMIN_TEST_EMAIL_TEMPLATES,
  type AdminTestEmailTemplate,
} from "@/lib/email/admin-test-email.schema";
import type { SmtpStatus } from "@/lib/email/get-smtp-status";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";

import { sendAdminTestEmailAction } from "./actions";

type AdminEmailTestCardProps = {
  adminEmail: string;
  smtpStatus: SmtpStatus;
  canOverrideRecipient: boolean;
};

const TEMPLATE_LABEL_KEYS: Record<AdminTestEmailTemplate, string> = {
  verification: "admin.settings.emailTest.templates.verification",
  password_reset: "admin.settings.emailTest.templates.passwordReset",
  email_change: "admin.settings.emailTest.templates.emailChange",
  welcome: "admin.settings.emailTest.templates.welcome",
  support_bug: "admin.settings.emailTest.templates.supportBug",
  support_suggestion: "admin.settings.emailTest.templates.supportSuggestion",
  support_feedback: "admin.settings.emailTest.templates.supportFeedback",
  user_signup_email: "admin.settings.emailTest.templates.userSignupEmail",
  user_signup_google: "admin.settings.emailTest.templates.userSignupGoogle",
};

export function AdminEmailTestCard({
  adminEmail,
  smtpStatus,
  canOverrideRecipient,
}: AdminEmailTestCardProps) {
  const { locale } = useLocale();
  const { showToast } = useToast();

  const [template, setTemplate] = useState<AdminTestEmailTemplate>("verification");
  const [testLocale, setTestLocale] = useState<"fr" | "en">("fr");
  const [recipientEmail, setRecipientEmail] = useState(adminEmail);
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    setIsSending(true);
    try {
      const result = await sendAdminTestEmailAction({
        template,
        locale: testLocale,
        recipientEmail: canOverrideRecipient ? recipientEmail.trim() : undefined,
      });

      if (result.success) {
        showToast(t(locale, "admin.settings.emailTest.sendSuccess"), "success");
        return;
      }

      const errorKey = getErrorTranslationKey(result.error);
      showToast(
        errorKey ? t(locale, errorKey) : result.error,
        "error",
      );
    } catch {
      showToast(t(locale, "common.error"), "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(locale, "admin.settings.emailTest.title")}</CardTitle>
        <CardDescription>{t(locale, "admin.settings.emailTest.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm">
          <p className="font-medium text-foreground">
            {t(locale, "admin.settings.emailTest.smtpTitle")}
          </p>
          <p className="mt-1 text-muted-foreground">
            {t(locale, "admin.settings.emailTest.smtpMode", {
              mode:
                smtpStatus.mode === "development"
                  ? t(locale, "admin.settings.emailTest.smtpModeDevelopment")
                  : t(locale, "admin.settings.emailTest.smtpModeProduction"),
            })}
          </p>
          <p className="text-muted-foreground">
            {smtpStatus.host}:{smtpStatus.port} · {smtpStatus.from}
          </p>
          {smtpStatus.mailpitUrl ? (
            <a
              href={smtpStatus.mailpitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-primary text-sm hover:underline"
            >
              {t(locale, "admin.settings.emailTest.openMailpit")}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email-test-template">
            {t(locale, "admin.settings.emailTest.templateLabel")}
          </Label>
          <Select
            value={template}
            onValueChange={(value) => setTemplate(value as AdminTestEmailTemplate)}
          >
            <SelectTrigger id="email-test-template">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ADMIN_TEST_EMAIL_TEMPLATES.map((item) => (
                <SelectItem key={item} value={item}>
                  {t(locale, TEMPLATE_LABEL_KEYS[item])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email-test-locale">{t(locale, "admin.settings.emailTest.localeLabel")}</Label>
          <Select
            value={testLocale}
            onValueChange={(value) => setTestLocale(value as "fr" | "en")}
          >
            <SelectTrigger id="email-test-locale">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">{t(locale, "admin.settings.emailTest.localeFr")}</SelectItem>
              <SelectItem value="en">{t(locale, "admin.settings.emailTest.localeEn")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email-test-recipient">
            {t(locale, "admin.settings.emailTest.recipientLabel")}
          </Label>
          {canOverrideRecipient ? (
            <Input
              id="email-test-recipient"
              type="email"
              autoComplete="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          ) : (
            <p
              id="email-test-recipient"
              className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm"
            >
              {adminEmail}
            </p>
          )}
          {!canOverrideRecipient ? (
            <p className="text-muted-foreground text-xs">
              {t(locale, "admin.settings.emailTest.recipientProductionHint")}
            </p>
          ) : null}
        </div>

        <p className="text-muted-foreground text-xs">
          {t(locale, "admin.settings.emailTest.fixtureHint")}
        </p>

        <Button
          type="button"
          onClick={handleSend}
          disabled={isSending || (canOverrideRecipient && !recipientEmail.trim())}
          className="w-full sm:w-auto"
        >
          {isSending
            ? t(locale, "admin.settings.emailTest.sending")
            : t(locale, "admin.settings.emailTest.send")}
        </Button>
      </CardContent>
    </Card>
  );
}

function getErrorTranslationKey(error: string): string | null {
  const map: Record<string, string> = {
    Unauthorized: "admin.settings.emailTest.errors.unauthorized",
    "Admin email is required": "admin.settings.emailTest.errors.adminEmailRequired",
    "Admin email tests are disabled": "admin.settings.emailTest.errors.disabled",
    "Please wait before sending another test email":
      "admin.settings.emailTest.errors.tooSoon",
    "Hourly test email limit reached": "admin.settings.emailTest.errors.hourlyLimit",
    "Failed to send test email": "admin.settings.emailTest.errors.sendFailed",
  };
  return map[error] ?? null;
}
