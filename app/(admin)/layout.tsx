import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminMobileTopbar } from "@/components/admin/admin-mobile-topbar";

/**
 * Admin layout: backoffice style, separate from user dashboard.
 * Requires ADMIN role; non-admin redirects to /dashboard.
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
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-56 xl:w-64 lg:flex-col">
        <AdminSidebar />
      </div>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-56 xl:pl-64">
        <AdminMobileTopbar />
        <main className="min-h-0 flex-1 overflow-auto pb-4">{children}</main>
        <footer className="border-t border-border/60 px-4 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} QuizLink — Admin
        </footer>
      </div>
    </div>
  );
}
