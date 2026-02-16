"use client";

import Link from "next/link";
import Image from "next/image";
import { FileText, Users, Sparkles, Plus, House, Globe, ShoppingBag } from "lucide-react";

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
        "flex h-full flex-col border-r border-border bg-card",
        className,
      )}
    >
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center border-b border-border/60 px-4">
        <Link
          href="/dashboard"
          onClick={onNavClick}
          className="flex items-center gap-2.5"
        >
          <div className="relative h-9 w-9 shrink-0">
            <Image
              src="/mascot.jpg"
              alt="QuizLink"
              fill
              className="object-contain"
              sizes="36px"
            />
          </div>
          <span className="font-black text-lg text-foreground">
            Quiz<span className="text-primary">Link</span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
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
          href="/quizzes"
          label={t(locale, "dashboard.sidebar.community")}
          icon={Globe}
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
          href="/account/coins"
          label={t(locale, "dashboard.sidebar.shop")}
          icon={ShoppingBag}
          onClick={onNavClick}
        />
      </nav>
    </aside>
  );
}
