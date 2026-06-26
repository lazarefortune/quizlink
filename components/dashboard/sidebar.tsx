"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import {
  ChevronsLeft,
  ChevronsRight,
  Coins,
} from "lucide-react";
import { useSession } from "next-auth/react";

import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { BrandQuizLinkText } from "@/components/BrandQuizLinkText";
import {
  DashboardCreateNavIcon,
  DashboardFeedbackNavIcon,
  DashboardHomeNavIcon,
  DashboardQuizzesNavIcon,
  DashboardSupportNavIcon,
  dashboardNavIconClassName,
} from "@/components/dashboard/dashboard-nav-icons";
import { dashboardSidebarNavItemClassName } from "@/components/dashboard/dashboard-sidebar-nav-styles";

import { Button } from "@/components/ui/button";
import { useBuilderNavigationGuard } from "@/components/dashboard/builder-navigation-guard-context";
import { useDashboardSidebarLayout } from "@/components/dashboard/dashboard-sidebar-layout-context";
import { useSupportFeedback } from "@/components/support/support-feedback-provider";

import { DashboardUserMenu } from "./dashboard-user-menu";
import { NavItem } from "./nav-item";
import { HugeiconsIcon } from "@hugeicons/react";
import { Coins01Icon } from "@hugeicons/core-free-icons";

type SidebarProps = {
  onNavClick?: () => void;
  className?: string;
};

function SidebarFeedbackNavButton({
  onNavClick,
  isCompact,
  label,
  ariaLabel,
  icon: Icon,
  onClick,
}: {
  onNavClick?: () => void;
  isCompact: boolean;
  label: string;
  ariaLabel: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        onClick();
        onNavClick?.();
      }}
      className={dashboardSidebarNavItemClassName({ isCompact })}
      title={isCompact ? label : undefined}
      aria-label={ariaLabel}
    >
      <Icon className={dashboardNavIconClassName} />
      {isCompact ? null : label}
    </button>
  );
}

export function Sidebar({ onNavClick, className }: SidebarProps) {
  const { locale } = useLocale();
  const { openUserFeedback, openSupportFeedback } = useSupportFeedback();
  const { data: session } = useSession();
  const { interceptLinkClick } = useBuilderNavigationGuard();
  const { isCollapsed, toggleCollapsed } = useDashboardSidebarLayout();
  const coinBalance = session?.user?.coinBalance ?? 0;

  const manageCoinsLabel = t(locale, "dashboard.home.manageCoins");
  const coinsNavLabel = t(locale, "nav.coins");

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col bg-card",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-border/60",
          isCollapsed ? "justify-center px-1" : "justify-between gap-2 px-3",
        )}
      >
        {isCollapsed ? null : (
          <Link
            href="/dashboard"
            onClick={(event) => {
              if (interceptLinkClick(event, "/dashboard")) {
                return;
              }
              onNavClick?.();
            }}
            className="flex min-w-0 flex-1 items-center gap-2.5"
          >
            <BrandQuizLinkText size="sm" className="min-w-0" />
          </Link>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground", isCollapsed && "mx-auto")}
          onClick={toggleCollapsed}
          aria-label={
            isCollapsed
              ? t(locale, "dashboard.sidebar.expandSidebarAria")
              : t(locale, "dashboard.sidebar.collapseSidebarAria")
          }
        >
          {isCollapsed ? (
            <ChevronsRight className="h-5 w-5" aria-hidden />
          ) : (
            <ChevronsLeft className="h-5 w-5" aria-hidden />
          )}
        </Button>
      </div>

      <nav className={cn("min-h-0 flex-1 space-y-1 overflow-y-auto", isCollapsed ? "p-2" : "p-3")}>
        <NavItem
          href="/dashboard"
          label={t(locale, "dashboard.sidebar.overview")}
          icon={DashboardHomeNavIcon}
          onClick={onNavClick}
          isCompact={isCollapsed}
        />
        <NavItem
          href="/dashboard/quizzes"
          label={t(locale, "dashboard.welcome.myQuizzes")}
          icon={DashboardQuizzesNavIcon}
          onClick={onNavClick}
          isCompact={isCollapsed}
        />
        <NavItem
          href="/dashboard/create"
          label={t(locale, "nav.create")}
          icon={DashboardCreateNavIcon}
          onClick={onNavClick}
          isCompact={isCollapsed}
        />
        <SidebarFeedbackNavButton
          onNavClick={onNavClick}
          isCompact={isCollapsed}
          label={t(locale, "userFeedback.navLabel")}
          ariaLabel={t(locale, "userFeedback.navLabel")}
          icon={DashboardFeedbackNavIcon}
          onClick={openUserFeedback}
        />
        <SidebarFeedbackNavButton
          onNavClick={onNavClick}
          isCompact={isCollapsed}
          label={t(locale, "support.navLabel")}
          ariaLabel={t(locale, "support.navLabel")}
          icon={DashboardSupportNavIcon}
          onClick={openSupportFeedback}
        />
      </nav>

      <div className={cn("shrink-0", isCollapsed ? "px-2 pb-2" : "px-3 pb-3")}>
        {isCollapsed ? (
          <Link
            href="/account/coins"
            onClick={(event) => {
              if (interceptLinkClick(event, "/account/coins")) {
                return;
              }
              onNavClick?.();
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-2xl border-2 p-2.5 text-center transition-colors",
              "border-sky-200/50 bg-[#E5F6FF] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
              "dark:border-white/10 dark:bg-[#23363d] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
              "hover:brightness-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1CB0F6]/45",
            )}
            title={`${coinsNavLabel}: ${coinBalance}`}
            aria-label={`${manageCoinsLabel}. ${coinsNavLabel}: ${coinBalance}`}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1CB0F6]/20 text-[#0284c7] dark:bg-white/15 dark:text-white"
              aria-hidden
            >
              <HugeiconsIcon icon={Coins01Icon} size={20} strokeWidth={2} className="text-muted-foreground" />
            </div>
            <span className="font-black tabular-nums text-base leading-none tracking-tight text-[#4B4B4B] dark:text-white">
              {coinBalance}
            </span>
            <span className="sr-only">{manageCoinsLabel}</span>
          </Link>
        ) : (
          <div
            className={cn(
              "rounded-2xl border-2 p-3",
              "border-sky-200/50 bg-[#E5F6FF] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
              "dark:border-white/10 dark:bg-[#23363d] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1CB0F6]/20 text-[#0284c7] dark:bg-white/15 dark:text-white"
                aria-hidden
              >
                <HugeiconsIcon icon={Coins01Icon} size={20} strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-wide text-[#4B4B4B] dark:text-white/70">
                  {t(locale, "nav.coins")}
                </p>
                <p className="font-black tabular-nums text-2xl leading-none tracking-tight text-[#4B4B4B] dark:text-white">
                  {coinBalance}
                </p>
              </div>
            </div>
            <Button
              asChild
              variant="ghost"
              className={cn(
                "mt-3 h-12 w-full rounded-xl border-0 px-4 font-black uppercase tracking-wide transition-[transform,box-shadow,filter]",
                "bg-[#1CB0F6] text-white shadow-[0_6px_0_#1899d6]",
                "hover:-translate-y-0.5 hover:bg-[#1CB0F6] hover:brightness-105 hover:shadow-[0_8px_0_#1899d6]",
                "active:translate-y-1 active:brightness-100 active:shadow-[0_2px_0_#1899d6]",
                "focus-visible:ring-2 focus-visible:ring-[#1CB0F6]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#E5F6FF]",
                "dark:bg-[#49c0f8] dark:text-[#131f24] dark:shadow-[0_6px_0_#1899d6]",
                "dark:hover:bg-[#49c0f8] dark:hover:brightness-105 dark:hover:shadow-[0_8px_0_#1899d6]",
                "dark:active:shadow-[0_2px_0_#1899d6]",
                "dark:focus-visible:ring-white/35 dark:focus-visible:ring-offset-[#23363d]",
              )}
            >
              <Link href="/account/coins" onClick={onNavClick}>
                {t(locale, "dashboard.home.manageCoins")}
              </Link>
            </Button>
          </div>
        )}
      </div>

      <div className={cn("shrink-0 border-t border-border/60", isCollapsed ? "p-2" : "p-3")}>
        <DashboardUserMenu isCompact={isCollapsed} />
      </div>
    </aside>
  );
}
