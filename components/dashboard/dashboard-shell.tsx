"use client";

import { usePathname } from "next/navigation";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { useLocale } from "@/lib/i18n/use-locale";
import { t, type Locale } from "@/lib/i18n";
import { useSession } from "next-auth/react";

type DashboardShellProps = {
  children: React.ReactNode;
  title?: string;
};

function getTitleFromPath(pathname: string | null, locale: Locale): string {
  if (!pathname) return t(locale, "dashboard.sidebar.overview");
  if (pathname === "/dashboard") return t(locale, "dashboard.sidebar.overview");
  if (pathname === "/dashboard/quizzes" || pathname.startsWith("/dashboard/quizzes/")) {
    return t(locale, "dashboard.sidebar.quizzes");
  }
  if (pathname.startsWith("/dashboard/community")) {
    return t(locale, "dashboard.sidebar.community");
  }
  if (pathname.startsWith("/dashboard/participants")) {
    return t(locale, "dashboard.sidebar.participants");
  }
  if (pathname.startsWith("/dashboard/quiz/")) {
    return t(locale, "dashboard.statistics");
  }
  if (pathname.startsWith("/account")) return t(locale, "dashboard.sidebar.account");
  if (pathname.startsWith("/generate")) return t(locale, "nav.generate");
  if (pathname.startsWith("/builder")) return t(locale, "nav.create");
  return t(locale, "dashboard.sidebar.overview");
}

export function DashboardShell({ children, title }: DashboardShellProps) {
  const pathname = usePathname();
  const { locale } = useLocale();
  const { data: session } = useSession();

  const pageTitle = title ?? getTitleFromPath(pathname, locale);
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-56 xl:w-64 lg:flex-col">
        <Sidebar isAdmin={isAdmin} />
      </div>

      {/* Main content: offset for desktop sidebar */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-56 xl:pl-64">
        <Topbar />
        <main className="min-h-0 flex-1 overflow-auto bg-background pb-16 lg:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  );
}
