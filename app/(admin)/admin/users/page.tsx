import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { normalizePage, normalizePageSize } from "@/lib/adminMetrics";
import { prisma } from "@/lib/prisma";

import { AdminUsersContent } from "./admin-users-content";

type AdminUsersPageProps = {
  searchParams?: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
  }>;
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const params = (await searchParams) ?? {};
  const pageSize = normalizePageSize(params.pageSize);
  const currentPage = normalizePage(params.page);
  const search = params.search?.trim() ?? "";

  const where = search
    ? {
        OR: [{ email: { contains: search } }, { name: { contains: search } }],
      }
    : {};

  const [totalUsers, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
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
      skip: (currentPage - 1) * pageSize,
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
      search={search}
    />
  );
}
