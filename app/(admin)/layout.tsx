import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminMobileTopbar } from "@/components/admin/admin-mobile-topbar";

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
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-56 xl:w-64 lg:flex-col">
        <AdminSidebar />
      </div>

      {/* Main content: offset for desktop sidebar */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-56 xl:pl-64">
        <AdminMobileTopbar />
        <main className="min-h-0 flex-1 overflow-auto bg-background pb-16 lg:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
