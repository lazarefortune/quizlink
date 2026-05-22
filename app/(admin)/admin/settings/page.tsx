import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import {
  canOverrideAdminTestEmailRecipient,
  getSmtpStatus,
} from "@/lib/email/get-smtp-status";
import { getSupportNotificationSettings } from "@/lib/settings/support-notification-settings";
import { getUserSignupNotificationSettings } from "@/lib/settings/user-signup-notification-settings";

import { AdminSettingsContent } from "./admin-settings-content";

export default async function AdminSettingsPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [supportNotifications, userSignupNotifications] = await Promise.all([
    getSupportNotificationSettings(),
    getUserSignupNotificationSettings(),
  ]);

  const adminEmail = session.user.email?.trim() ?? "";
  const smtpStatus = getSmtpStatus();
  const canOverrideRecipient = canOverrideAdminTestEmailRecipient();

  return (
    <AdminSettingsContent
      initialSupportNotifications={supportNotifications}
      initialUserSignupNotifications={userSignupNotifications}
      adminEmail={adminEmail}
      smtpStatus={smtpStatus}
      canOverrideRecipient={canOverrideRecipient}
    />
  );
}
