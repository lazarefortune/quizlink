"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut, signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import {
  updateProfile,
  changePassword,
  requestEmailChange,
  verifyEmailChange,
  deleteAccount,
  deleteAccountGoogle,
  unlinkGoogleAccount,
  updateNotificationPreferencesAction,
} from "./actions";
import {
  Eye,
  EyeOff,
  ChevronRight,
  User,
  Mail,
  Lock,
  Languages,
  Coins,
  Trash2,
  Cookie,
  FileText,
  Bell,
  Headset,
} from "lucide-react";
import { GoogleIcon } from "@/components/ui/google-icon";
import { format } from "date-fns";
import { fr as frLocale, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useCookieConsent } from "@/components/cookie-consent/cookie-consent-context";
import { useSupportFeedback } from "@/components/support/support-feedback-provider";

type UserData = {
  id: string;
  name: string;
  email: string;
  preferredLanguage: "fr" | "en";
  emailVerifiedAt: Date | null;
  createdAt: Date;
  hasGoogleAccount: boolean;
  hasPassword: boolean;
  notifyQuizResponses: boolean;
  notifyProductUpdates: boolean;
  notifyMarketing: boolean;
};

type AccountContentProps = {
  user: UserData;
};

// --- Reusable row component ---
function SettingsRow({
  icon: Icon,
  label,
  value,
  onClick,
  href,
  isDestructive = false,
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
  onClick?: () => void;
  href?: string;
  isDestructive?: boolean;
}) {
  const content = (
    <div
      className={cn(
        "flex items-center gap-3 sm:gap-4 px-4 py-3 transition-colors cursor-pointer rounded-lg",
        isDestructive
          ? "hover:bg-destructive/5"
          : "hover:bg-muted/60 active:bg-muted",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          isDestructive ? "bg-destructive/10" : "bg-muted",
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4",
            isDestructive ? "text-red-500 dark:text-red-400" : "text-muted-foreground",
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-base font-medium",
            isDestructive && "text-red-500 dark:text-red-400",
          )}
        >
          {label}
        </p>
        {value && (
          <p className="text-base text-muted-foreground truncate mt-0.5">
            {value}
          </p>
        )}
      </div>
      <ChevronRight
        className={cn(
          "h-4 w-4 shrink-0",
          isDestructive ? "text-red-500 dark:text-red-400/40" : "text-muted-foreground/40",
        )}
      />
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return (
    <button type="button" className="w-full text-left" onClick={onClick}>
      {content}
    </button>
  );
}

function NotificationSwitchRow({
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
  id,
}: {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (next: boolean) => void;
  id: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="text-base font-medium text-foreground cursor-pointer">
          {label}
        </label>
        {description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        className="mt-0.5 shrink-0"
        aria-label={label}
      />
    </div>
  );
}

export function AccountContent({ user: initialUser }: AccountContentProps) {
  const { openSupportFeedback } = useSupportFeedback();
  const { openConsentPanel } = useCookieConsent();
  const router = useRouter();
  const { locale, setLocale } = useLocale();
  const toast = useToast();
  const session = useSession();

  // Dialog visibility
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Profile state
  const [name, setName] = useState(initialUser.name);
  const [preferredLanguage, setPreferredLanguage] = useState<"fr" | "en">(
    initialUser.preferredLanguage,
  );
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Email change state
  const [newEmail, setNewEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [emailChangeStep, setEmailChangeStep] = useState<
    "request" | "verify"
  >("request");
  const [isRequestingEmailChange, setIsRequestingEmailChange] = useState(false);
  const [isVerifyingEmailChange, setIsVerifyingEmailChange] = useState(false);

  // Delete account state
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Google link/unlink state
  const [showUnlinkGoogleDialog, setShowUnlinkGoogleDialog] = useState(false);
  const [isUnlinkingGoogle, setIsUnlinkingGoogle] = useState(false);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);

  const [notifyQuizResponses, setNotifyQuizResponses] = useState(
    initialUser.notifyQuizResponses,
  );
  const [notifyProductUpdates, setNotifyProductUpdates] = useState(
    initialUser.notifyProductUpdates,
  );
  const [notifyMarketing, setNotifyMarketing] = useState(initialUser.notifyMarketing);
  const [notificationPrefsSaving, setNotificationPrefsSaving] = useState(false);

  useEffect(() => {
    setNotifyQuizResponses(initialUser.notifyQuizResponses);
    setNotifyProductUpdates(initialUser.notifyProductUpdates);
    setNotifyMarketing(initialUser.notifyMarketing);
  }, [
    initialUser.notifyQuizResponses,
    initialUser.notifyProductUpdates,
    initialUser.notifyMarketing,
  ]);

  const memberSince = format(new Date(initialUser.createdAt), "MMMM yyyy", {
    locale: locale === "fr" ? frLocale : enUS,
  });

  // Initials for avatar
  const initials = initialUser.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // --- Handlers ---
  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      toast.showToast(t(locale, "account.nameRequired"), "error");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const result = await updateProfile(name.trim(), preferredLanguage);
      if (result.success) {
        if (preferredLanguage !== locale) {
          setLocale(preferredLanguage);
        }
        toast.showToast(t(locale, "account.profileUpdated"), "success");
        if (session.update) {
          try {
            await session.update();
            await new Promise((resolve) => setTimeout(resolve, 200));
          } catch (error) {
            console.error("Error updating session:", error);
          }
        }
        window.location.href = "/account";
      } else {
        toast.showToast(
          result.error || t(locale, "account.profileUpdateError"),
          "error",
        );
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.showToast(t(locale, "account.profileUpdateError"), "error");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.showToast(t(locale, "account.allFieldsRequired"), "error");
      return;
    }
    if (newPassword.length < 8) {
      toast.showToast(t(locale, "auth.passwordTooShort"), "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.showToast(t(locale, "account.passwordsDoNotMatch"), "error");
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await changePassword(currentPassword, newPassword);
      if (result.success) {
        toast.showToast(t(locale, "account.passwordChanged"), "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordDialog(false);
      } else {
        toast.showToast(
          result.error || t(locale, "account.passwordChangeError"),
          "error",
        );
      }
    } catch {
      toast.showToast(t(locale, "account.passwordChangeError"), "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRequestEmailChange = async () => {
    if (!newEmail.trim()) {
      toast.showToast(t(locale, "account.emailRequired"), "error");
      return;
    }

    setIsRequestingEmailChange(true);
    try {
      const result = await requestEmailChange(newEmail.trim(), locale);
      if (result.success) {
        toast.showToast(t(locale, "account.emailChangeCodeSent"), "success");
        setEmailChangeStep("verify");
      } else {
        toast.showToast(
          result.error || t(locale, "account.emailChangeRequestError"),
          "error",
        );
      }
    } catch {
      toast.showToast(t(locale, "account.emailChangeRequestError"), "error");
    } finally {
      setIsRequestingEmailChange(false);
    }
  };

  const handleVerifyEmailChange = async () => {
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      toast.showToast(t(locale, "account.codeRequired"), "error");
      return;
    }

    setIsVerifyingEmailChange(true);
    try {
      const result = await verifyEmailChange(verificationCode.trim());
      if (result.success) {
        toast.showToast(t(locale, "account.emailChanged"), "success");
        setNewEmail("");
        setVerificationCode("");
        setEmailChangeStep("request");
        setShowEmailDialog(false);
        router.refresh();
      } else {
        toast.showToast(
          result.error || t(locale, "account.emailChangeVerifyError"),
          "error",
        );
      }
    } catch {
      toast.showToast(t(locale, "account.emailChangeVerifyError"), "error");
    } finally {
      setIsVerifyingEmailChange(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      let result;
      if (initialUser.hasPassword) {
        if (!deletePassword) {
          toast.showToast(
            t(locale, "account.passwordRequiredForDeletion"),
            "error",
          );
          setIsDeletingAccount(false);
          return;
        }
        result = await deleteAccount(deletePassword);
      } else {
        result = await deleteAccountGoogle();
      }

      if (result.success) {
        await signOut({ redirect: true, callbackUrl: "/" });
      } else {
        toast.showToast(
          result.error || t(locale, "account.deleteAccountError"),
          "error",
        );
        setIsDeletingAccount(false);
      }
    } catch {
      toast.showToast(t(locale, "account.deleteAccountError"), "error");
      setIsDeletingAccount(false);
    }
  };

  const handleLinkGoogle = async () => {
    setIsLinkingGoogle(true);
    await signIn("google", { callbackUrl: "/account" });
  };

  const handleUnlinkGoogle = async () => {
    setIsUnlinkingGoogle(true);
    try {
      const result = await unlinkGoogleAccount();
      if (result.success) {
        toast.showToast(t(locale, "account.security.googleUnlinked"), "success");
        setShowUnlinkGoogleDialog(false);
        router.refresh();
      } else {
        toast.showToast(
          result.error || t(locale, "account.security.googleUnlinkError"),
          "error",
        );
      }
    } catch {
      toast.showToast(t(locale, "account.security.googleUnlinkError"), "error");
    } finally {
      setIsUnlinkingGoogle(false);
    }
  };

  const handleUpdateLanguage = async () => {
    // Language-only update (name stays the same)
    setIsUpdatingProfile(true);
    try {
      const result = await updateProfile(initialUser.name, preferredLanguage);
      if (result.success) {
        if (preferredLanguage !== locale) {
          setLocale(preferredLanguage);
        }
        toast.showToast(t(locale, "account.profileUpdated"), "success");
        if (session.update) {
          try {
            await session.update();
            await new Promise((resolve) => setTimeout(resolve, 200));
          } catch (error) {
            console.error("Error updating session:", error);
          }
        }
        window.location.href = "/account";
      } else {
        toast.showToast(
          result.error || t(locale, "account.profileUpdateError"),
          "error",
        );
      }
    } catch (error) {
      console.error("Error updating language:", error);
      toast.showToast(t(locale, "account.profileUpdateError"), "error");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const persistNotificationPreferences = async (next: {
    notifyQuizResponses: boolean;
    notifyProductUpdates: boolean;
    notifyMarketing: boolean;
  }) => {
    setNotificationPrefsSaving(true);
    try {
      const result = await updateNotificationPreferencesAction(next);
      if (result.success) {
        setNotifyQuizResponses(next.notifyQuizResponses);
        setNotifyProductUpdates(next.notifyProductUpdates);
        setNotifyMarketing(next.notifyMarketing);
        toast.showToast(t(locale, "account.notifications.updateSuccess"), "success");
        router.refresh();
      } else {
        toast.showToast(
          result.error || t(locale, "account.notifications.updateError"),
          "error",
        );
      }
    } catch {
      toast.showToast(t(locale, "account.notifications.updateError"), "error");
    } finally {
      setNotificationPrefsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 md:p-6 lg:p-8 max-w-xl mx-auto">
      <div className="space-y-6 sm:space-y-8">
        {/* Profile header */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
          <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-full bg-blue/10 text-blue text-xl sm:text-2xl font-bold">
            {initials}
          </div>
          <div className="min-w-0 text-center sm:text-left">
            <h1 className="h1 text-xl sm:text-2xl font-semibold tracking-tight truncate">
              {initialUser.name}
            </h1>
            <p className="mt-0.5 text-base font-medium text-muted-foreground">
              {locale === "fr" ? "Membre depuis" : "Member since"} {memberSince}
            </p>
          </div>
        </div>

        {/* Settings */}
        <div className="max-w-xl space-y-5 sm:space-y-6">
          {/* Compte */}
          <div className="space-y-2">
            <h2 className="text-lg h2 font-semibold text-muted-foreground px-1 uppercase">
              {locale === "fr" ? "Compte" : "Account"}
            </h2>
            <Card className="border-2">
              <CardContent className="p-1.5 space-y-0.5">
                <SettingsRow
                  icon={User}
                  label={t(locale, "account.profile.title")}
                  value={initialUser.name}
                  onClick={() => setShowProfileDialog(true)}
                />
                <SettingsRow
                  icon={Mail}
                  label={t(locale, "account.email.title")}
                  value={
                    initialUser.email +
                    (initialUser.emailVerifiedAt
                      ? ""
                      : ` — ${locale === "fr" ? "Non vérifié" : "Not verified"}`)
                  }
                  onClick={() => setShowEmailDialog(true)}
                />
                <SettingsRow
                  icon={Languages}
                  label={t(locale, "account.profile.language")}
                  value={
                    initialUser.preferredLanguage === "fr"
                      ? "Français"
                      : "English"
                  }
                  onClick={() => setShowLanguageDialog(true)}
                />
                <SettingsRow
                  icon={Coins}
                  label={t(locale, "account.coins.title")}
                  href="/account/coins"
                />
                <SettingsRow
                  icon={Cookie}
                  label={t(locale, "cookieConsent.account.rowTitle")}
                  value={t(locale, "cookieConsent.account.rowHint")}
                  onClick={() => openConsentPanel()}
                />
              </CardContent>
            </Card>
          </div>

          {/* Support */}
          <div className="space-y-2">
            <h2 className="text-lg h2 font-semibold text-muted-foreground px-1 uppercase">
              {t(locale, "support.account.sectionTitle")}
            </h2>
            <Card className="border-2">
              <CardContent className="space-y-4 p-4">
                <p className="text-base text-muted-foreground">
                  {t(locale, "support.account.teaser")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => openSupportFeedback()}
                >
                  <Headset className="mr-2 h-4 w-4" />
                  {t(locale, "support.account.cta")}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Notifications */}
          <div className="space-y-2">
            <h2 className="text-lg h2 font-semibold text-muted-foreground px-1 uppercase">
              {t(locale, "account.notifications.sectionTitle")}
            </h2>
            <Card className="border-2">
              <CardContent className="p-1.5 space-y-0.5">
                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium text-foreground">
                      {t(locale, "account.notifications.transactionalTitle")}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground leading-snug">
                      {t(locale, "account.notifications.transactionalDescription")}
                    </p>
                  </div>
                </div>
                <NotificationSwitchRow
                  id="notify-quiz-responses"
                  label={t(locale, "account.notifications.quizResponses")}
                  checked={notifyQuizResponses}
                  disabled={notificationPrefsSaving}
                  onCheckedChange={(next) => {
                    void persistNotificationPreferences({
                      notifyQuizResponses: next,
                      notifyProductUpdates,
                      notifyMarketing,
                    });
                  }}
                />
                <NotificationSwitchRow
                  id="notify-product-updates"
                  label={t(locale, "account.notifications.productUpdates")}
                  checked={notifyProductUpdates}
                  disabled={notificationPrefsSaving}
                  onCheckedChange={(next) => {
                    void persistNotificationPreferences({
                      notifyQuizResponses,
                      notifyProductUpdates: next,
                      notifyMarketing,
                    });
                  }}
                />
                <NotificationSwitchRow
                  id="notify-marketing"
                  label={t(locale, "account.notifications.marketing")}
                  checked={notifyMarketing}
                  disabled={notificationPrefsSaving}
                  onCheckedChange={(next) => {
                    void persistNotificationPreferences({
                      notifyQuizResponses,
                      notifyProductUpdates,
                      notifyMarketing: next,
                    });
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Légal */}
          <div className="space-y-2">
            <h2 className="text-lg h2 font-semibold text-muted-foreground px-1 uppercase">
              {t(locale, "account.legalSectionTitle")}
            </h2>
            <Card className="border-2">
              <CardContent className="p-1.5 space-y-0.5">
                <SettingsRow
                  icon={FileText}
                  label={t(locale, "footer.legal.legalNotice")}
                  href="/account/legal"
                />
                <SettingsRow
                  icon={FileText}
                  label={t(locale, "footer.legal.terms")}
                  href="/account/legal/terms"
                />
                <SettingsRow
                  icon={FileText}
                  label={t(locale, "account.salesTermsRow")}
                  href="/account/legal/sales"
                />
                <SettingsRow
                  icon={FileText}
                  label={t(locale, "footer.legal.privacy")}
                  href="/account/legal/privacy"
                />
                <SettingsRow
                  icon={FileText}
                  label={t(locale, "footer.legal.cookies")}
                  href="/account/legal/cookies"
                />
              </CardContent>
            </Card>
          </div>

          {/* Sécurité */}
          <div className="space-y-2">
            <h2 className="text-lg h2 font-semibold text-muted-foreground px-1 uppercase">
              {t(locale, "account.security.title")}
            </h2>
            <Card className="border-2">
              <CardContent className="p-1.5 space-y-0.5">
                {/* Google lié */}
                {initialUser.hasGoogleAccount && (
                  <div className="rounded-lg border border-border/70 bg-muted/20 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <GoogleIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium">
                          {t(locale, "account.security.googleConnected")}
                        </p>
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                          {initialUser.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {initialUser.hasGoogleAccount && initialUser.hasPassword && (
                  <SettingsRow
                    icon={GoogleIcon}
                    label={t(locale, "account.security.googleUnlink")}
                    onClick={() => setShowUnlinkGoogleDialog(true)}
                    isDestructive
                  />
                )}

                {/* Lier Google si pas encore lié */}
                {!initialUser.hasGoogleAccount && (
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={handleLinkGoogle}
                    disabled={isLinkingGoogle}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 px-4 py-3 transition-colors cursor-pointer rounded-lg hover:bg-muted/60 active:bg-muted">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <GoogleIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium">
                          {isLinkingGoogle
                            ? t(locale, "common.loading")
                            : t(locale, "account.security.googleLink")}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {t(locale, "account.security.googleLinkDescription")}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                    </div>
                  </button>
                )}

                {/* Changer le mot de passe */}
                {initialUser.hasPassword && (
                  <SettingsRow
                    icon={Lock}
                    label={t(locale, "account.security.changePassword")}
                    onClick={() => setShowPasswordDialog(true)}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Zone de danger */}
          <div className="space-y-2">
            <h2 className="text-lg h2 font-semibold text-red-500 dark:text-red-400 px-1 uppercase">
              {t(locale, "account.dangerZone.title")}
            </h2>
            <Card className="border-2 border-red-500 dark:border-red-400">
              <CardContent className="p-1.5">
                <SettingsRow
                  icon={Trash2}
                  label={t(locale, "account.dangerZone.deleteAccount")}
                  isDestructive
                  onClick={() => setShowDeleteDialog(true)}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ==================== DIALOGS ==================== */}

      {/* Profile Dialog (name only) */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t(locale, "account.profile.title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="dialog-name">
                {t(locale, "account.profile.name")} *
              </Label>
              <Input
                id="dialog-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setShowProfileDialog(false)}
                disabled={isUpdatingProfile}
              >
                {t(locale, "common.cancel")}
              </Button>
              <Button
                variant="blue"
                onClick={handleUpdateProfile}
                disabled={isUpdatingProfile || name.trim() === initialUser.name}
              >
                {isUpdatingProfile
                  ? t(locale, "common.loading")
                  : t(locale, "account.profile.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Language Dialog */}
      <Dialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t(locale, "account.profile.language")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="dialog-language">
                {t(locale, "account.profile.language")}
              </Label>
              <Select
                value={preferredLanguage}
                onValueChange={(value: "fr" | "en") =>
                  setPreferredLanguage(value)
                }
              >
                <SelectTrigger id="dialog-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setShowLanguageDialog(false)}
                disabled={isUpdatingProfile}
              >
                {t(locale, "common.cancel")}
              </Button>
              <Button
                variant="blue"
                onClick={handleUpdateLanguage}
                disabled={
                  isUpdatingProfile ||
                  preferredLanguage === initialUser.preferredLanguage
                }
              >
                {isUpdatingProfile
                  ? t(locale, "common.loading")
                  : t(locale, "account.profile.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog
        open={showEmailDialog}
        onOpenChange={(open) => {
          setShowEmailDialog(open);
          if (!open) {
            setEmailChangeStep("request");
            setNewEmail("");
            setVerificationCode("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t(locale, "account.email.title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>{t(locale, "account.email.currentEmail")}</Label>
              <p className="text-sm font-medium">{initialUser.email}</p>
              {initialUser.emailVerifiedAt ? (
                <p className="text-xs text-green-600 dark:text-green-400">
                  {t(locale, "account.email.verified")}
                </p>
              ) : (
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  {t(locale, "account.email.notVerified")}
                </p>
              )}
            </div>

            {emailChangeStep === "request" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="dialog-newEmail">
                    {t(locale, "account.email.newEmail")}
                  </Label>
                  <Input
                    id="dialog-newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => setShowEmailDialog(false)}
                    disabled={isRequestingEmailChange}
                  >
                    {t(locale, "common.cancel")}
                  </Button>
                  <Button
                    variant="blue"
                    onClick={handleRequestEmailChange}
                    disabled={isRequestingEmailChange || !newEmail.trim()}
                  >
                    {isRequestingEmailChange
                      ? t(locale, "common.loading")
                      : t(locale, "account.email.sendCode")}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="dialog-verificationCode">
                    {t(locale, "account.email.verificationCode")}
                  </Label>
                  <Input
                    id="dialog-verificationCode"
                    value={verificationCode}
                    onChange={(e) =>
                      setVerificationCode(
                        e.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                    placeholder="000000"
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t(locale, "account.email.codeHint")}
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEmailChangeStep("request");
                      setVerificationCode("");
                    }}
                    disabled={isVerifyingEmailChange}
                  >
                    {t(locale, "common.cancel")}
                  </Button>
                  <Button
                    variant="blue"
                    onClick={handleVerifyEmailChange}
                    disabled={
                      isVerifyingEmailChange || verificationCode.length !== 6
                    }
                  >
                    {isVerifyingEmailChange
                      ? t(locale, "common.loading")
                      : t(locale, "account.email.verify")}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog
        open={showPasswordDialog}
        onOpenChange={(open) => {
          setShowPasswordDialog(open);
          if (!open) {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t(locale, "account.security.changePassword")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="dialog-currentPassword">
                {t(locale, "account.security.currentPassword")}
              </Label>
              <div className="relative">
                <Input
                  id="dialog-currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dialog-newPassword">
                {t(locale, "account.security.newPassword")}
              </Label>
              <div className="relative">
                <Input
                  id="dialog-newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dialog-confirmPassword">
                {t(locale, "account.security.confirmPassword")}
              </Label>
              <div className="relative">
                <Input
                  id="dialog-confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setShowPasswordDialog(false)}
                disabled={isChangingPassword}
              >
                {t(locale, "common.cancel")}
              </Button>
              <Button
                variant="blue"
                onClick={handleChangePassword}
                disabled={
                  isChangingPassword ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword
                }
              >
                {isChangingPassword
                  ? t(locale, "common.loading")
                  : t(locale, "account.security.changePassword")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unlink Google Dialog */}
      <AlertDialog open={showUnlinkGoogleDialog} onOpenChange={setShowUnlinkGoogleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(locale, "account.security.googleUnlinkConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(locale, "account.security.googleUnlinkConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnlinkingGoogle}>
              {t(locale, "common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlinkGoogle}
              disabled={isUnlinkingGoogle}
              className={buttonVariants({ variant: "destructive" })}
            >
              {isUnlinkingGoogle
                ? t(locale, "common.loading")
                : t(locale, "account.security.googleUnlink")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open) {
            setDeletePassword("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(locale, "account.dangerZone.deleteConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {initialUser.hasPassword
                ? t(locale, "account.dangerZone.deleteConfirmDescription")
                : t(locale, "account.dangerZone.deleteGoogleConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {initialUser.hasPassword && (
            <div className="space-y-2 py-2">
              <Label htmlFor="dialog-deletePassword">
                {t(locale, "account.dangerZone.password")}
              </Label>
              <div className="relative">
                <Input
                  id="dialog-deletePassword"
                  type={showDeletePassword ? "text" : "password"}
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowDeletePassword(!showDeletePassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showDeletePassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAccount}>
              {t(locale, "common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={
                isDeletingAccount ||
                (initialUser.hasPassword && !deletePassword)
              }
              className={buttonVariants({ variant: "destructive" })}
            >
              {isDeletingAccount
                ? t(locale, "common.loading")
                : t(locale, "account.dangerZone.deleteAccount")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
