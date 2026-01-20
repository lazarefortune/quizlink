import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminCoinsContent } from "./admin-coins-content";

export default async function AdminCoinsPage() {
  const session = await auth();

  // Only admins can access this page
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <AdminCoinsContent />;
}
