"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, FileText, Users, Plus, User, Sparkles, Pen } from "lucide-react";

import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type NavItemConfig = {
  href: string;
  labelKey: string;
  icon: React.ElementType;
  matchExact?: boolean;
  isAction?: boolean;
};

const navItems: NavItemConfig[] = [
  { href: "/dashboard", labelKey: "nav.home", icon: House, matchExact: true },
  { href: "/dashboard/quizzes", labelKey: "dashboard.sidebar.quizzes", icon: FileText },
  { href: "/create", labelKey: "nav.create", icon: Plus, isAction: true },
  { href: "/dashboard/participants", labelKey: "dashboard.sidebar.participants", icon: Users },
  { href: "/account", labelKey: "dashboard.sidebar.account", icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { locale } = useLocale();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const isActive = (item: NavItemConfig) => {
    if (!pathname) return false;
    if (item.matchExact) return pathname === item.href;
    /* /dashboard matche aussi les sous-routes /dashboard/quizzes, etc.
       On exclut le match si un item plus specifique matche deja. */
    if (item.href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(item.href);
  };

  const isCreateActive =
    pathname?.startsWith("/builder") || pathname?.startsWith("/generate");

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background lg:hidden">
        <div className="flex items-end justify-around px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isCurrent =
              item.isAction ? isCreateActive : isActive(item);

            if (item.isAction) {
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  className="flex flex-1 flex-col items-center gap-1 pb-1.5 pt-1 text-sm font-medium transition-colors text-primary"
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md -mt-4 transition-transform active:scale-95",
                      isCreateActive && "ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="font-black font-nunito">{t(locale, item.labelKey)}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors",
                  isCurrent
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              >
                {isCurrent && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-full bg-primary" />
                )}
                <Icon
                  className={cn(
                    "h-6 w-6 transition-colors",
                    isCurrent ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span className={cn(isCurrent && "font-black font-nunito")}>
                  {t(locale, item.labelKey)}
                </span>
              </Link>
            );
          })}
        </div>
        {/* Safe area for iPhones with home indicator */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>

      {/* Create quiz modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-black font-nunito">
              {locale === "fr" ? "Crée ton quiz !" : "Create your quiz!"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-2 pb-1">
            <Link
              href="/builder"
              onClick={() => setIsCreateOpen(false)}
              className="group flex flex-col items-center gap-3 rounded-xl border-2 border-border bg-card p-5 transition-all hover:border-primary hover:shadow-md active:scale-[0.97]"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <Pen className="h-7 w-7" />
              </span>
              <div className="text-center">
                <p className="text-sm font-black font-nunito">{t(locale, "nav.createManually")}</p>
              </div>
            </Link>
            <Link
              href="/generate"
              onClick={() => setIsCreateOpen(false)}
              className="group flex flex-col items-center gap-3 rounded-xl border-2 border-border bg-card p-5 transition-all hover:border-blue hover:shadow-md active:scale-[0.97]"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue/10 text-blue transition-colors group-hover:bg-blue/20">
                <Sparkles className="h-7 w-7" />
              </span>
              <div className="text-center">
                <p className="text-sm font-black font-nunito">{t(locale, "nav.createWithAI")}</p>
              </div>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
