"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Eye, EyeOff, AlertTriangle } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  preferredLanguage: "fr" | "en";
  emailVerifiedAt: Date | null;
};

type AccountContentProps = {
  user: User;
};

export function AccountContent({ user: initialUser }: AccountContentProps) {
  const router = useRouter();
  const { locale, setLocale } = useLocale();
  const toast = useToast();
  const session = useSession();

  // Profile state
  const [name, setName] = useState(initialUser.name);
  const [preferredLanguage, setPreferredLanguage] = useState<"fr" | "en">(
    initialUser.preferredLanguage
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
  const [emailChangeStep, setEmailChangeStep] = useState<"request" | "verify">("request");
  const [isRequestingEmailChange, setIsRequestingEmailChange] = useState(false);
  const [isVerifyingEmailChange, setIsVerifyingEmailChange] = useState(false);

  // Delete account state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      toast.showToast(t(locale, "account.nameRequired"), "error");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const result = await updateProfile(name.trim(), preferredLanguage);
      if (result.success) {
        // Update locale if language changed
        if (preferredLanguage !== locale) {
          setLocale(preferredLanguage);
        }

        toast.showToast(t(locale, "account.profileUpdated"), "success");

        // Force session update by calling update() which triggers jwt callback
        // The jwt callback now always fetches fresh data from DB
        if (session.update) {
          try {
            await session.update();
            // Wait a bit for the update to propagate
            await new Promise((resolve) => setTimeout(resolve, 200));
          } catch (error) {
            console.error("Error updating session:", error);
          }
        }

        // Force a complete page reload to ensure session is refreshed
        // Using window.location.href ensures a full reload, not just a client-side navigation
        window.location.href = "/account";
      } else {
        toast.showToast(result.error || t(locale, "account.profileUpdateError"), "error");
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
      } else {
        toast.showToast(result.error || t(locale, "account.passwordChangeError"), "error");
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
        toast.showToast(result.error || t(locale, "account.emailChangeRequestError"), "error");
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
        router.refresh();
      } else {
        toast.showToast(result.error || t(locale, "account.emailChangeVerifyError"), "error");
      }
    } catch {
      toast.showToast(t(locale, "account.emailChangeVerifyError"), "error");
    } finally {
      setIsVerifyingEmailChange(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.showToast(t(locale, "account.passwordRequiredForDeletion"), "error");
      return;
    }

    setIsDeletingAccount(true);
    try {
      const result = await deleteAccount(deletePassword);
      if (result.success) {
        await signOut({ redirect: true, callbackUrl: "/" });
      } else {
        toast.showToast(result.error || t(locale, "account.deleteAccountError"), "error");
        setIsDeletingAccount(false);
      }
    } catch {
      toast.showToast(t(locale, "account.deleteAccountError"), "error");
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t(locale, "account.title")}</h1>
          <p className="text-muted-foreground mt-2">{t(locale, "account.description")}</p>
        </div>

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t(locale, "account.profile.title")}</CardTitle>
            <CardDescription>{t(locale, "account.profile.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t(locale, "account.profile.name")} *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t(locale, "account.profile.namePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">{t(locale, "account.profile.language")}</Label>
              <Select
                value={preferredLanguage}
                onValueChange={(value: "fr" | "en") => setPreferredLanguage(value)}
              >
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleUpdateProfile}
              disabled={isUpdatingProfile || (name.trim() === initialUser.name && preferredLanguage === initialUser.preferredLanguage)}
              variant="primary"
            >
              {isUpdatingProfile
                ? t(locale, "common.loading")
                : t(locale, "account.profile.save")}
            </Button>
          </CardContent>
        </Card>

        {/* Email Change Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t(locale, "account.email.title")}</CardTitle>
            <CardDescription>{t(locale, "account.email.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t(locale, "account.email.currentEmail")}</Label>
              <Input value={initialUser.email} readOnly className="bg-muted" />
              {initialUser.emailVerifiedAt ? (
                <p className="text-sm text-green-600 dark:text-green-400">
                  {t(locale, "account.email.verified")}
                </p>
              ) : (
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  {t(locale, "account.email.notVerified")}
                </p>
              )}
            </div>

            {emailChangeStep === "request" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="newEmail">{t(locale, "account.email.newEmail")}</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder={t(locale, "auth.emailPlaceholder")}
                  />
                </div>
                <Button
                  onClick={handleRequestEmailChange}
                  disabled={isRequestingEmailChange || !newEmail.trim()}
                  variant="primary"
                >
                  {isRequestingEmailChange
                    ? t(locale, "common.loading")
                    : t(locale, "account.email.sendCode")}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="verificationCode">{t(locale, "account.email.verificationCode")}</Label>
                  <Input
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                  />
                  <p className="text-sm text-muted-foreground">
                    {t(locale, "account.email.codeHint")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleVerifyEmailChange}
                    disabled={isVerifyingEmailChange || verificationCode.length !== 6}
                    variant="primary"
                  >
                    {isVerifyingEmailChange
                      ? t(locale, "common.loading")
                      : t(locale, "account.email.verify")}
                  </Button>
                  <Button
                    onClick={() => {
                      setEmailChangeStep("request");
                      setVerificationCode("");
                    }}
                    variant="secondary"
                    disabled={isVerifyingEmailChange}
                  >
                    {t(locale, "common.cancel")}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t(locale, "account.security.title")}</CardTitle>
            <CardDescription>{t(locale, "account.security.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t(locale, "account.security.currentPassword")}</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t(locale, "auth.passwordPlaceholder")}
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
              <Label htmlFor="newPassword">{t(locale, "account.security.newPassword")}</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t(locale, "auth.passwordPlaceholder")}
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
              <Label htmlFor="confirmPassword">{t(locale, "account.security.confirmPassword")}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t(locale, "auth.passwordPlaceholder")}
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
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
              variant="primary"
            >
              {isChangingPassword
                ? t(locale, "common.loading")
                : t(locale, "account.security.changePassword")}
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {t(locale, "account.dangerZone.title")}
            </CardTitle>
            <CardDescription>{t(locale, "account.dangerZone.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deletePassword">{t(locale, "account.dangerZone.password")}</Label>
              <div className="relative">
                <Input
                  id="deletePassword"
                  type={showDeletePassword ? "text" : "password"}
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder={t(locale, "auth.passwordPlaceholder")}
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
            <Button
              onClick={() => setShowDeleteDialog(true)}
              disabled={!deletePassword}
              variant="destructive"
            >
              {t(locale, "account.dangerZone.deleteAccount")}
            </Button>
          </CardContent>
        </Card>

        {/* Delete Account Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t(locale, "account.dangerZone.deleteConfirmTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t(locale, "account.dangerZone.deleteConfirmDescription")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingAccount}>
                {t(locale, "common.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeletingAccount
                  ? t(locale, "common.loading")
                  : t(locale, "account.dangerZone.deleteAccount")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
