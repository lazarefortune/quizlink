"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";
import { format } from "date-fns";
import { fr as frLocale, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

type UserData = {
  id: string;
  name: string;
  email: string;
  preferredLanguage: "fr" | "en";
  emailVerifiedAt: Date | null;
  createdAt: Date;
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

export function AccountContent({ user: initialUser }: AccountContentProps) {
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
    if (!deletePassword) {
      toast.showToast(
        t(locale, "account.passwordRequiredForDeletion"),
        "error",
      );
      return;
    }

    setIsDeletingAccount(true);
    try {
      const result = await deleteAccount(deletePassword);
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

  return (
    <div className="p-4 sm:p-5 md:p-6 lg:p-8 max-w-4xl mx-auto">
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
            <h2 className="text-lg h2 font-semibold text-muted-foreground px-1">
              {locale === "fr" ? "Compte" : "Account"}
            </h2>
            <Card>
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
              </CardContent>
            </Card>
          </div>

          {/* Sécurité */}
          <div className="space-y-2">
            <h2 className="text-lg h2 font-semibold text-muted-foreground px-1">
              {t(locale, "account.security.title")}
            </h2>
            <Card>
              <CardContent className="p-1.5">
                <SettingsRow
                  icon={Lock}
                  label={t(locale, "account.security.changePassword")}
                  onClick={() => setShowPasswordDialog(true)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Zone de danger */}
          <div className="space-y-2">
            <h2 className="text-lg h2 font-semibold text-red-500 dark:text-red-400 px-1">
              {t(locale, "account.dangerZone.title")}
            </h2>
            <Card className="border-red-500 dark:border-red-400">
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
              {t(locale, "account.dangerZone.deleteConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
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
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAccount}>
              {t(locale, "common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount || !deletePassword}
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
