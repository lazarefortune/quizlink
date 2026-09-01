import { auth } from "@/lib/auth";
import { buildDailySignupSeries } from "@/lib/adminMetrics";
import { prisma } from "@/lib/prisma";
import { getTotalSignupsEver } from "@/lib/userLifecycleEvents";
import { formatLongDate } from "@/lib/date-time/format";
import { getRequestTimeZone } from "@/lib/date-time/server";
import { resolveDashboardWelcomeGreetingKey } from "@/lib/dashboardWelcomeGreeting";
import { AdminDashboardContent } from "./admin-dashboard-content";

export default async function AdminDashboardPage() {
  const session = await auth();
  const locale = "fr";
  const timeZone = await getRequestTimeZone();
  const now = new Date();
  const headerDate = formatLongDate(now, locale, timeZone);
  const greetingKey = resolveDashboardWelcomeGreetingKey(now, timeZone);
  const greeting =
    greetingKey === "dashboard.welcome.titleGreetingMorning"
      ? locale === "fr"
        ? "Bonjour"
        : "Good morning"
      : greetingKey === "dashboard.welcome.titleGreetingAfternoon"
        ? locale === "fr"
          ? "Bon après-midi"
          : "Good afternoon"
        : greetingKey === "dashboard.welcome.titleGreetingEvening"
          ? locale === "fr"
            ? "Bonsoir"
            : "Good evening"
          : locale === "fr"
            ? "Bonsoir"
            : "Good evening";

  const signupsLast365DaysStart = new Date();
  signupsLast365DaysStart.setHours(0, 0, 0, 0);
  signupsLast365DaysStart.setDate(signupsLast365DaysStart.getDate() - 365);

  const [
    totalSignupsEver,
    totalUsersCurrent,
    totalQuizzesEver,
    coinPurchasesEver,
    signupEventsLast365Days,
  ] = await Promise.all([
    getTotalSignupsEver(prisma),
    prisma.user.count(),
    prisma.quiz.count(),
    prisma.coinTransaction.count({
      where: {
        amount: {
          gt: 0,
        },
        reason: {
          startsWith: "Achat pack ",
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
    "fr",
    timeZone,
  );

  return (
    <AdminDashboardContent
      currentUserName={session?.user?.name ?? ""}
      headerDate={headerDate}
      greeting={greeting}
      metrics={{
        totalSignupsEver,
        totalUsersCurrent,
        totalQuizzesEver,
        coinPurchasesEver,
      }}
      signupTrend={signupTrend}
    />
  );
}
