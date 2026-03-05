import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminDashboardContent } from "./admin-dashboard-content";

export default async function AdminDashboardPage() {
  const session = await auth();

  // Only admins can access this page
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch all users with pagination
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      coinBalance: true,
      createdAt: true,
      emailVerifiedAt: true,
      _count: {
        select: {
          quizzes: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100, // Limit to first 100 users
  });

  const usersWithVerifiedAt = users.map((u) => ({
    ...u,
    verifiedAt: u.emailVerifiedAt,
  }));

  return <AdminDashboardContent initialUsers={usersWithVerifiedAt} />;
}
