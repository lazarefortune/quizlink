import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getSupportNotificationSettings } from "@/lib/settings/support-notification-settings";

import { AdminSettingsContent } from "./admin-settings-content";

export default async function AdminSettingsPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const supportNotifications = await getSupportNotificationSettings();

  return <AdminSettingsContent initialSupportNotifications={supportNotifications} />;
}
