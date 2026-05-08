"use client";

import Link from "next/link";
import Image from "next/image";
import { FileText, Plus, House, Coins } from "lucide-react";
import { useSession } from "next-auth/react";

import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

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
            Quiz<span className="text-primary">Link</span>
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
          label={t(locale, "dashboard.sidebar.quizzes")}
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
        <Link
          href="/account/coins"
          onClick={onNavClick}
          className="block rounded-2xl border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 shrink-0 text-blue" />
            <span className="font-black tabular-nums text-lg text-blue">
              {coinBalance}
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
            {t(locale, "dashboard.sidebar.coinsHint")}
          </p>
        </Link>
      </div>

      <div className="shrink-0 border-t border-border/60 p-3">
        <DashboardUserMenu />
      </div>
    </aside>
  );
}
