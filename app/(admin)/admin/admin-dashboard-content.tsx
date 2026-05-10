"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { Coins, FileText, Users } from "lucide-react";
import { RealSignupsChart } from "@/components/admin/real-signups-chart";

type AdminDashboardContentProps = {
  currentUserName: string;
  headerDate: string;
  greeting: string;
  metrics: {
    totalSignupsEver: number;
    totalUsersCurrent: number;
    totalQuizzesEver: number;
    coinPurchasesEver: number;
  };
  signupTrend: Array<{
    dateKey: string;
    label: string;
    signups: number;
  }>;
};

type StatCardProps = {
  value: string;
  label: string;
  icon: ReactNode;
  href?: string;
};

function StatCard({ value, label, icon, href }: StatCardProps) {
  const card = (
    <Card className="group relative h-full overflow-hidden border border-slate-300 bg-white shadow-none transition-all duration-300 hover:bg-slate-100/50 dark:border-border dark:bg-card dark:hover:bg-secondary">
      <CardContent className="relative flex h-full flex-col p-5">
        <span className="text-base font-semibold text-slate-600 dark:text-slate-400">
          {label}
        </span>
        <div className="mt-6 flex-1">
          <p className="text-3xl font-medium text-slate-800 tabular-nums dark:text-slate-200">{value}</p>
        </div>
        <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-slate-100 text-slate-900 dark:border-border dark:bg-card dark:text-slate-100">
          {icon}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block h-full cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {card}
      </Link>
    );
  }

  return card;
}

export function AdminDashboardContent({
  currentUserName,
  headerDate,
  greeting,
  metrics,
  signupTrend,
}: AdminDashboardContentProps) {
  const { locale } = useLocale();

  return (
    <div className="px-1 lg:px-3">
      <div>
        <div className="mb-6">
          <p className="text-sm text-muted-foreground capitalize">
            {headerDate}
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold">
            {greeting}{" "}
            <span className="text-primary">{currentUserName || "Admin"}</span> !
          </h1>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <motion.div
            className="h-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <StatCard
              value={metrics.totalSignupsEver.toLocaleString(locale === "fr" ? "fr-FR" : "en-US")}
              label={t(locale, "admin.dashboard.signupsEver")}
              icon={<Users className="h-4 w-4" />}
            />
          </motion.div>
          <motion.div
            className="h-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <StatCard
              value={metrics.totalUsersCurrent.toLocaleString(locale === "fr" ? "fr-FR" : "en-US")}
              label={t(locale, "admin.dashboard.usersList")}
              icon={<Users className="h-4 w-4" />}
              href="/admin/users"
            />
          </motion.div>
          <motion.div
            className="h-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <StatCard
              value={metrics.totalQuizzesEver.toLocaleString(locale === "fr" ? "fr-FR" : "en-US")}
              label={t(locale, "admin.dashboard.totalQuizzesEver")}
              icon={<FileText className="h-4 w-4" />}
            />
          </motion.div>
          <motion.div
            className="h-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <StatCard
              value={metrics.coinPurchasesEver.toLocaleString(locale === "fr" ? "fr-FR" : "en-US")}
              label={t(locale, "admin.dashboard.coinPurchasesEver")}
              icon={<Coins className="h-4 w-4" />}
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}>
              <h2 className="text-lg font-semibold mb-4">{t(locale, "admin.dashboard.realSignupTrend")}</h2>
              <RealSignupsChart data={signupTrend} />
        </motion.div>
      </div>
    </div>
  );
}
