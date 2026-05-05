"use client";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { Eye, Minus, Users } from "lucide-react";
import { RealSignupsChart } from "@/components/admin/real-signups-chart";

type AdminDashboardContentProps = {
  currentUserName: string;
  headerDate: string;
  greeting: string;
  metrics: {
    totalSignupsEver: number;
    totalUsersCurrent: number;
    loginSuccessLast30Days: number;
    loginFailuresLast30Days: number;
  };
  signupTrend: Array<{
    dateKey: string;
    label: string;
    signups: number;
  }>;
};

export function AdminDashboardContent({
  currentUserName,
  headerDate,
  greeting,
  metrics,
  signupTrend,
}: AdminDashboardContentProps) {
  const { locale } = useLocale();

  return (
    <div className="p-4 sm:p-5 md:p-6 lg:p-8">
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

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
          <Card className="col-span-1">
            <CardContent className="p-5 flex items-center gap-3 relative">
              <div className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-sm border border-border text-muted-foreground">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-medium text-muted-foreground">
                  {t(locale, "admin.dashboard.signupsEver")}
                </p>
                <p className="mt-6 text-3xl font-bold font-mono">{metrics.totalSignupsEver}</p>
              </div>
            </CardContent>
          </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
          <Card className="col-span-1">
            <CardContent className="p-5 flex items-center gap-3 relative">
              <div className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-sm border border-border text-muted-foreground">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-medium text-muted-foreground">
                  {t(locale, "admin.dashboard.usersList")}
                </p>
                <p className="mt-6 text-3xl font-bold font-mono">{metrics.totalUsersCurrent}</p>
              </div>
            </CardContent>
          </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
          <Card className="col-span-1">
            <CardContent className="p-5 flex items-center gap-3 relative">
              <div className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-sm border border-border text-muted-foreground">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-medium text-muted-foreground">
                  {t(locale, "admin.dashboard.loginSuccessLast30Days")}
                </p>
                <p className="mt-6 text-3xl font-bold font-mono">{metrics.loginSuccessLast30Days}</p>
              </div>
            </CardContent>
          </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
          <Card className="col-span-1">
            <CardContent className="p-5 flex items-center gap-3 relative">
              <div className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-sm border border-border text-muted-foreground">
                <Minus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-medium text-muted-foreground">
                  {t(locale, "admin.dashboard.loginFailuresLast30Days")}
                </p>
                <p className="mt-6 text-3xl font-bold font-mono">{metrics.loginFailuresLast30Days}</p>
              </div>
            </CardContent>
          </Card>
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
