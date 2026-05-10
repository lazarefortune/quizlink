"use client";

import Link from "next/link";
import { Coins, FileText, House, Plus } from "lucide-react";
import { useSession } from "next-auth/react";

import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { BrandQuizLinkText } from "@/components/BrandQuizLinkText";

import { Button } from "@/components/ui/button";
import { DashboardUserMenu } from "./dashboard-user-menu";
import { NavItem } from "./nav-item";

type SidebarProps = {
  onNavClick?: () => void;
  className?: string;
};

export function Sidebar({ onNavClick, className }: SidebarProps) {
  const { locale } = useLocale();
  const { data: session } = useSession();
  const coinBalance = session?.user?.coinBalance ?? 0;

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col bg-card",
        className,
      )}
    >
      <div className="flex h-14 shrink-0 items-center border-b border-border/60 px-4">
        <Link
          href="/dashboard"
          onClick={onNavClick}
          className="flex items-center gap-2.5"
        >
          <span className="font-black text-lg text-foreground">
            <BrandQuizLinkText />
          </span>
        </Link>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
        <NavItem
          href="/dashboard"
          label={t(locale, "dashboard.sidebar.overview")}
          icon={House}
          onClick={onNavClick}
        />
        <NavItem
          href="/dashboard/quizzes"
          label={t(locale, "dashboard.welcome.myQuizzes")}
          icon={FileText}
          onClick={onNavClick}
        />
        <NavItem
          href="/dashboard/create"
          label={t(locale, "nav.create")}
          icon={Plus}
          onClick={onNavClick}
        />
      </nav>

      <div className="shrink-0 px-3 pb-3">
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
              <Coins className="h-5 w-5" strokeWidth={2.25} />
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
          <p className="mt-2 font-fredoka text-xs font-medium leading-snug text-[#4B4B4B]/85 dark:text-white/55">
            {t(locale, "dashboard.sidebar.coinsHint")}
          </p>
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
            <Link
              href="/account/coins"
              onClick={onNavClick}
            >
              {t(locale, "dashboard.home.manageCoins")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="shrink-0 border-t border-border/60 p-3">
        <DashboardUserMenu />
      </div>
    </aside>
  );
}
