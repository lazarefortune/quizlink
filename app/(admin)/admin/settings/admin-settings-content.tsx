"use client";

import { useState } from "react";
import { z } from "zod";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import type { SupportNotificationSettings } from "@/lib/settings/support-notification-settings";
import type { UserSignupNotificationSettings } from "@/lib/settings/user-signup-notification-settings";

import {
  updateSupportNotificationSettingsAction,
  updateUserSignupNotificationSettingsAction,
} from "./actions";

const singleEmailSchema = z.string().trim().pipe(z.string().email());

type AdminSettingsContentProps = {
  initialSupportNotifications: SupportNotificationSettings;
  initialUserSignupNotifications: UserSignupNotificationSettings;
};

export function AdminSettingsContent({
  initialSupportNotifications,
  initialUserSignupNotifications,
}: AdminSettingsContentProps) {
  const { locale } = useLocale();
  const { showToast } = useToast();

  const [enabled, setEnabled] = useState(initialSupportNotifications.enabled);
  const [emails, setEmails] = useState<string[]>(initialSupportNotifications.emails);
  const [notifyOnBug, setNotifyOnBug] = useState(initialSupportNotifications.notifyOnBug);
  const [notifyOnSuggestion, setNotifyOnSuggestion] = useState(
    initialSupportNotifications.notifyOnSuggestion,
  );
  const [notifyOnFeedback, setNotifyOnFeedback] = useState(
    initialSupportNotifications.notifyOnFeedback,
  );
  const [newEmail, setNewEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [signupEnabled, setSignupEnabled] = useState(
    initialUserSignupNotifications.enabled,
  );
  const [signupEmails, setSignupEmails] = useState<string[]>(
    initialUserSignupNotifications.emails,
  );
  const [notifyOnEmailSignup, setNotifyOnEmailSignup] = useState(
    initialUserSignupNotifications.notifyOnEmailSignup,
  );
  const [notifyOnGoogleSignup, setNotifyOnGoogleSignup] = useState(
    initialUserSignupNotifications.notifyOnGoogleSignup,
  );
  const [newSignupEmail, setNewSignupEmail] = useState("");
  const [isSavingSignup, setIsSavingSignup] = useState(false);

  const handleAddEmail = () => {
    const trimmed = newEmail.trim();
    if (!trimmed) {
      return;
    }

    const parsed = singleEmailSchema.safeParse(trimmed);
    if (!parsed.success) {
      showToast(t(locale, "admin.settings.supportNotifications.invalidEmail"), "error");
      return;
    }

    const normalized = parsed.data.toLowerCase();
    const hasDuplicate = emails.some((e) => e.toLowerCase() === normalized);
    if (hasDuplicate) {
      showToast(t(locale, "admin.settings.supportNotifications.duplicateEmail"), "error");
      return;
    }

    if (emails.length >= 10) {
      showToast(t(locale, "admin.settings.supportNotifications.maxEmails"), "error");
      return;
    }

    setEmails((prev) => [...prev, parsed.data]);
    setNewEmail("");
  };

  const handleRemoveEmail = (index: number) => {
    setEmails((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateSupportNotificationSettingsAction({
        enabled,
        emails,
        notifyOnBug,
        notifyOnSuggestion,
        notifyOnFeedback,
      });

      if (result.success) {
        showToast(t(locale, "admin.settings.supportNotifications.saveSuccess"), "success");
        return;
      }

      showToast(result.error, "error");
    } catch {
      showToast(t(locale, "common.error"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSignupEmail = () => {
    const trimmed = newSignupEmail.trim();
    if (!trimmed) {
      return;
    }

    const parsed = singleEmailSchema.safeParse(trimmed);
    if (!parsed.success) {
      showToast(t(locale, "admin.settings.userSignupNotifications.invalidEmail"), "error");
      return;
    }

    const normalized = parsed.data.toLowerCase();
    const hasDuplicate = signupEmails.some((e) => e.toLowerCase() === normalized);
    if (hasDuplicate) {
      showToast(
        t(locale, "admin.settings.userSignupNotifications.duplicateEmail"),
        "error",
      );
      return;
    }

    if (signupEmails.length >= 10) {
      showToast(t(locale, "admin.settings.userSignupNotifications.maxEmails"), "error");
      return;
    }

    setSignupEmails((prev) => [...prev, parsed.data]);
    setNewSignupEmail("");
  };

  const handleRemoveSignupEmail = (index: number) => {
    setSignupEmails((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveSignup = async () => {
    setIsSavingSignup(true);
    try {
      const result = await updateUserSignupNotificationSettingsAction({
        enabled: signupEnabled,
        emails: signupEmails,
        notifyOnEmailSignup,
        notifyOnGoogleSignup,
      });

      if (result.success) {
        showToast(
          t(locale, "admin.settings.userSignupNotifications.saveSuccess"),
          "success",
        );
        return;
      }

      showToast(result.error, "error");
    } catch {
      showToast(t(locale, "common.error"), "error");
    } finally {
      setIsSavingSignup(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12 lg:px-8">
      <div>
        <h1 className="font-semibold text-2xl text-foreground tracking-tight">
          {t(locale, "admin.settings.pageTitle")}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t(locale, "admin.settings.pageDescription")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t(locale, "admin.settings.supportNotifications.title")}</CardTitle>
          <CardDescription>
            {t(locale, "admin.settings.supportNotifications.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex flex-row items-center justify-between gap-4 rounded-lg border border-border/60 p-4">
            <div className="space-y-0.5">
              <Label htmlFor="support-notif-enabled" className="text-base">
                {t(locale, "admin.settings.supportNotifications.enabledLabel")}
              </Label>
            </div>
            <Switch
              id="support-notif-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base">
              {t(locale, "admin.settings.supportNotifications.recipientsLabel")}
            </Label>
            {emails.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {emails.map((email, index) => (
                  <li
                    key={`${email}-${index}`}
                    className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2"
                  >
                    <span className="truncate text-sm">{email}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleRemoveEmail(index)}
                      aria-label={t(locale, "admin.settings.supportNotifications.removeAria")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">
                {t(locale, "admin.settings.supportNotifications.noRecipients")}
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="support-new-email" className="sr-only">
                  {t(locale, "admin.settings.supportNotifications.emailPlaceholder")}
                </Label>
                <Input
                  id="support-new-email"
                  type="email"
                  autoComplete="email"
                  placeholder={t(locale, "admin.settings.supportNotifications.emailPlaceholder")}
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={emails.length >= 10}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddEmail();
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddEmail}
                disabled={emails.length >= 10}
              >
                {t(locale, "admin.settings.supportNotifications.add")}
              </Button>
            </div>
            {emails.length >= 10 ? (
              <p className="text-muted-foreground text-xs">
                {t(locale, "admin.settings.supportNotifications.maxEmailsHint")}
              </p>
            ) : null}
          </div>

          <div className="space-y-4">
            <Label className="text-base">
              {t(locale, "admin.settings.supportNotifications.typesLabel")}
            </Label>
            <div className="space-y-3 rounded-lg border border-border/60 p-4">
              <div className="flex flex-row items-center justify-between gap-4">
                <Label htmlFor="support-notify-bug" className="font-normal">
                  {t(locale, "admin.settings.supportNotifications.bugs")}
                </Label>
                <Switch
                  id="support-notify-bug"
                  checked={notifyOnBug}
                  onCheckedChange={setNotifyOnBug}
                />
              </div>
              <div className="flex flex-row items-center justify-between gap-4">
                <Label htmlFor="support-notify-suggestion" className="font-normal">
                  {t(locale, "admin.settings.supportNotifications.suggestions")}
                </Label>
                <Switch
                  id="support-notify-suggestion"
                  checked={notifyOnSuggestion}
                  onCheckedChange={setNotifyOnSuggestion}
                />
              </div>
              <div className="flex flex-row items-center justify-between gap-4">
                <Label htmlFor="support-notify-feedback" className="font-normal">
                  {t(locale, "admin.settings.supportNotifications.feedback")}
                </Label>
                <Switch
                  id="support-notify-feedback"
                  checked={notifyOnFeedback}
                  onCheckedChange={setNotifyOnFeedback}
                />
              </div>
            </div>
          </div>

          <Button type="button" onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
            {isSaving
              ? t(locale, "admin.settings.supportNotifications.saving")
              : t(locale, "admin.settings.supportNotifications.save")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t(locale, "admin.settings.userSignupNotifications.title")}</CardTitle>
          <CardDescription>
            {t(locale, "admin.settings.userSignupNotifications.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex flex-row items-center justify-between gap-4 rounded-lg border border-border/60 p-4">
            <div className="space-y-0.5">
              <Label htmlFor="signup-notif-enabled" className="text-base">
                {t(locale, "admin.settings.userSignupNotifications.enabledLabel")}
              </Label>
            </div>
            <Switch
              id="signup-notif-enabled"
              checked={signupEnabled}
              onCheckedChange={setSignupEnabled}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base">
              {t(locale, "admin.settings.userSignupNotifications.recipientsLabel")}
            </Label>
            {signupEmails.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {signupEmails.map((email, index) => (
                  <li
                    key={`${email}-${index}`}
                    className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2"
                  >
                    <span className="truncate text-sm">{email}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleRemoveSignupEmail(index)}
                      aria-label={t(
                        locale,
                        "admin.settings.userSignupNotifications.removeAria",
                      )}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">
                {t(locale, "admin.settings.userSignupNotifications.noRecipients")}
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="signup-new-email" className="sr-only">
                  {t(locale, "admin.settings.userSignupNotifications.emailPlaceholder")}
                </Label>
                <Input
                  id="signup-new-email"
                  type="email"
                  autoComplete="email"
                  placeholder={t(
                    locale,
                    "admin.settings.userSignupNotifications.emailPlaceholder",
                  )}
                  value={newSignupEmail}
                  onChange={(e) => setNewSignupEmail(e.target.value)}
                  disabled={signupEmails.length >= 10}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSignupEmail();
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddSignupEmail}
                disabled={signupEmails.length >= 10}
              >
                {t(locale, "admin.settings.userSignupNotifications.add")}
              </Button>
            </div>
            {signupEmails.length >= 10 ? (
              <p className="text-muted-foreground text-xs">
                {t(locale, "admin.settings.userSignupNotifications.maxEmailsHint")}
              </p>
            ) : null}
          </div>

          <div className="space-y-4">
            <Label className="text-base">
              {t(locale, "admin.settings.userSignupNotifications.typesLabel")}
            </Label>
            <div className="space-y-3 rounded-lg border border-border/60 p-4">
              <div className="flex flex-row items-center justify-between gap-4">
                <Label htmlFor="signup-notify-email" className="font-normal">
                  {t(locale, "admin.settings.userSignupNotifications.emailSignup")}
                </Label>
                <Switch
                  id="signup-notify-email"
                  checked={notifyOnEmailSignup}
                  onCheckedChange={setNotifyOnEmailSignup}
                />
              </div>
              <div className="flex flex-row items-center justify-between gap-4">
                <Label htmlFor="signup-notify-google" className="font-normal">
                  {t(locale, "admin.settings.userSignupNotifications.googleSignup")}
                </Label>
                <Switch
                  id="signup-notify-google"
                  checked={notifyOnGoogleSignup}
                  onCheckedChange={setNotifyOnGoogleSignup}
                />
              </div>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleSaveSignup}
            disabled={isSavingSignup}
            className="w-full sm:w-auto"
          >
            {isSavingSignup
              ? t(locale, "admin.settings.userSignupNotifications.saving")
              : t(locale, "admin.settings.userSignupNotifications.save")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
