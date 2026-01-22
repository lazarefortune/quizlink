import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminPacksContent } from "./admin-packs-content";

export default async function AdminPacksPage() {
  const session = await auth();

  // Only admins can access this page
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <AdminPacksContent />;
}
