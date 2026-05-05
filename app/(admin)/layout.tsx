import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Admin layout: mêmes principes de design que le DashboardShell
 * (sidebar fixe à gauche, topbar mobile, main scrollable),
 * mais avec la navigation/admin-specific et accès réservé aux ADMIN.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <AdminShell>{children}</AdminShell>
  );
}
