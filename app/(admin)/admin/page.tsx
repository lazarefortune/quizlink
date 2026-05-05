import { auth } from "@/lib/auth";
import { buildDailySignupSeries } from "@/lib/adminMetrics";
import { prisma } from "@/lib/prisma";
import { USER_AUTH_EVENT_TYPES } from "@/lib/userAuthEvents";
import { getTotalSignupsEver } from "@/lib/userLifecycleEvents";
import { AdminDashboardContent } from "./admin-dashboard-content";

export default async function AdminDashboardPage() {
  const session = await auth();
  const locale = "fr";
  const now = new Date();
  const headerDate = now.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const hour = now.getHours();
  const greeting =
    hour < 12
      ? locale === "fr"
        ? "Bonjour"
        : "Good morning"
      : hour < 18
        ? locale === "fr"
          ? "Bon après-midi"
          : "Good afternoon"
        : locale === "fr"
          ? "Bonsoir"
          : "Good evening";

  const signupsLast30DaysStart = new Date();
  signupsLast30DaysStart.setHours(0, 0, 0, 0);
  signupsLast30DaysStart.setDate(signupsLast30DaysStart.getDate() - 30);
  const signupsLast365DaysStart = new Date();
  signupsLast365DaysStart.setHours(0, 0, 0, 0);
  signupsLast365DaysStart.setDate(signupsLast365DaysStart.getDate() - 365);

  const [
    totalSignupsEver,
    totalUsersCurrent,
    loginSuccessLast30Days,
    loginFailuresLast30Days,
    signupEventsLast365Days,
  ] = await Promise.all([
    getTotalSignupsEver(prisma),
    prisma.user.count(),
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
    prisma.userLifecycleEvent.findMany({
      where: {
        eventType: "SIGNUP",
        createdAt: {
          gte: signupsLast365DaysStart,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
  ]);

  const signupTrend = buildDailySignupSeries(
    signupEventsLast365Days.map((event: { createdAt: Date }) => event.createdAt),
    365,
    "fr"
  );

  return (
    <AdminDashboardContent
      currentUserName={session?.user?.name ?? ""}
      headerDate={headerDate}
      greeting={greeting}
      metrics={{
        totalSignupsEver,
        totalUsersCurrent,
        loginSuccessLast30Days,
        loginFailuresLast30Days,
      }}
      signupTrend={signupTrend}
    />
  );
}
