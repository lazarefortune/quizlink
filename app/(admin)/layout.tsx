import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

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
    <div className="min-h-screen bg-muted/30">
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 w-full pt-16 lg:pt-0 lg:ml-64">
          <div className="container mx-auto p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
