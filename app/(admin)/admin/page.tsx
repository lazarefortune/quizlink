import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { USER_AUTH_EVENT_TYPES } from "@/lib/userAuthEvents";
import { getSignupsSince, getTotalSignupsEver } from "@/lib/userLifecycleEvents";
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
    take: 100, // Limit to first 100 users
  });

  const usersWithVerifiedAt = users.map((u) => ({
    ...u,
    verifiedAt: u.emailVerifiedAt,
    hasGoogleAccount: Boolean(u.googleId),
  }));

  const signupsLast30DaysStart = new Date();
  signupsLast30DaysStart.setDate(signupsLast30DaysStart.getDate() - 30);

  const [
    totalSignupsEver,
    signupsLast30Days,
    loginSuccessLast30Days,
    loginFailuresLast30Days,
  ] = await Promise.all([
    getTotalSignupsEver(prisma),
    getSignupsSince(prisma, signupsLast30DaysStart),
    prisma.userAuthEvent.count({
      where: {
        eventType: USER_AUTH_EVENT_TYPES.LOGIN_SUCCESS,
        createdAt: {
          gte: signupsLast30DaysStart,
        },
      },
    }),
    prisma.userAuthEvent.count({
      where: {
        eventType: USER_AUTH_EVENT_TYPES.LOGIN_FAILURE,
        createdAt: {
          gte: signupsLast30DaysStart,
        },
      },
    }),
  ]);

  return (
    <AdminDashboardContent
      initialUsers={usersWithVerifiedAt}
      metrics={{
        totalSignupsEver,
        signupsLast30Days,
        loginSuccessLast30Days,
        loginFailuresLast30Days,
      }}
    />
  );
}
