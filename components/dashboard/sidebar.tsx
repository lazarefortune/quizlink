"use client";

import Link from "next/link";
import { FileText, Users, Shield, Sparkles, Plus, User, House } from "lucide-react";

import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { NavItem } from "./nav-item";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

type SidebarProps = {
  isAdmin?: boolean;
  onNavClick?: () => void;
  className?: string;
};

export function Sidebar({
  isAdmin = false,
  onNavClick,
  className,
}: SidebarProps) {
  const { locale } = useLocale();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-muted",
        className,
      )}
    >
      <div className="flex h-14 shrink-0 items-center border-b border-border/60 px-4">
        <Link
          href="/dashboard"
          onClick={onNavClick}
          className="font-bold text-lg text-foreground"
        >
          QuizLink
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
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
          href="/dashboard/participants"
          label={t(locale, "dashboard.sidebar.participants")}
          icon={Users}
          onClick={onNavClick}
        />
        <NavItem
          href="/generate"
          label={t(locale, "nav.generate")}
          icon={Sparkles}
          onClick={onNavClick}
        />
        <NavItem
          href="/builder"
          label={t(locale, "nav.create")}
          icon={Plus}
          onClick={onNavClick}
        />
        <Separator className="my-2" />
        <NavItem
          href="/account"
          label={t(locale, "dashboard.sidebar.account")}
          icon={User}
          onClick={onNavClick}
        />
        {isAdmin && (
          <>
            <Separator className="my-2" />
            <NavItem
              href="/admin"
              label={t(locale, "dashboard.sidebar.admin")}
              icon={Shield}
              onClick={onNavClick}
            />
          </>
        )}
      </nav>
    </aside>
  );
}
