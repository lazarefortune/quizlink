import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

/**
 * Authenticated app layout: one dashboard shell (sidebar + topbar + main) for all user pages.
 * Redirects to signin if not authenticated.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
