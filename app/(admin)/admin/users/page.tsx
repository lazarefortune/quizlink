import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { normalizePageSize } from "@/lib/adminMetrics";
import { prisma } from "@/lib/prisma";

import { AdminUsersContent } from "./admin-users-content";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const pageSize = normalizePageSize(undefined);
  const currentPage = 1;

  const [totalUsers, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        coinBalance: true,
        googleId: true,
        createdAt: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            quizzes: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: 0,
      take: pageSize,
    }),
  ]);

  const normalizedUsers = users.map((user) => ({
    ...user,
    verifiedAt: user.emailVerifiedAt,
    hasGoogleAccount: Boolean(user.googleId),
  }));

  return (
    <AdminUsersContent
      users={normalizedUsers}
      currentPage={currentPage}
      pageSize={pageSize}
      totalUsers={totalUsers}
    />
  );
}
