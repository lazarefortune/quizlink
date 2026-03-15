"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Coins,
  Package,
  MessageSquare,
  Shield,
  BarChart3,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";

const navItems = [
  { href: "/admin", label: "admin.nav.dashboard", icon: LayoutDashboard },
  { href: "/admin/coins", label: "admin.nav.coins", icon: Coins },
  { href: "/admin/packs", label: "admin.nav.packs", icon: Package },
  { href: "/admin/feedback", label: "admin.nav.feedback", icon: MessageSquare },
  { href: "/admin/analytics", label: "admin.nav.analytics", icon: BarChart3 },
];

export function AdminSidebar({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();
  const { locale } = useLocale();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname?.startsWith(href);
  };

  return (
    <aside className="flex h-full flex-col border-r border-border bg-white dark:bg-background">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Shield className="h-4 w-4 text-primary-foreground" />
        </div>
        <Link
          href="/admin"
          onClick={onNavClick}
          className="font-bold text-lg text-foreground"
        >
          Admin
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={cn(
                "flex items-center gap-3 font-sofia-sans rounded-lg px-3 py-2.5 text-lg font-bold transition-colors",
                active
                  ? "bg-blue text-blue-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{t(locale, item.label)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border/60 p-3">
        <Link
          href="/dashboard"
          onClick={onNavClick}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5 shrink-0" />
          <span>{t(locale, "admin.nav.backToDashboard")}</span>
        </Link>
      </div>
    </aside>
  );
}
