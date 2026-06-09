"use client";

import { useState } from "react";
import type { ElementType } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DashboardCreateNavIcon,
  DashboardFeedbackNavIcon,
  DashboardHomeNavIcon,
  DashboardQuizzesNavIcon,
  DashboardSupportNavIcon,
  dashboardNavIconClassName,
} from "@/components/dashboard/dashboard-nav-icons";
import { dashboardSidebarNavItemClassName } from "@/components/dashboard/dashboard-sidebar-nav-styles";
import { Menu, Shield, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import { DashboardUserPreferencesPanel } from "@/components/dashboard/dashboard-user-preferences-panel";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { BrandQuizLinkText } from "@/components/BrandQuizLinkText";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";

import { useSupportFeedback } from "@/components/support/support-feedback-provider";
import { useBuilderNavigationGuard } from "@/components/dashboard/builder-navigation-guard-context";

import { DashboardMobileNavSheetLink } from "./dashboard-mobile-nav-sheet-link";

export function DashboardMobileNavSheet() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const { locale } = useLocale();
  const router = useRouter();
  const { openUserFeedback, openSupportFeedback } = useSupportFeedback();
  const { interceptLinkClick, requestAction } = useBuilderNavigationGuard();

  const handleSignOut = () => {
    requestAction(async () => {
      setOpen(false);
      await signOut({ redirect: false });
      router.push("/");
      router.refresh();
    });
  };

  const primaryNav: Array<{
    href: string;
    icon: ElementType;
    label: string;
    isActive: boolean;
  }> = [
    {
      href: "/dashboard",
      icon: DashboardHomeNavIcon,
      label: t(locale, "dashboard.sidebar.overview"),
      isActive: pathname === "/dashboard",
    },
    {
      href: "/dashboard/quizzes",
      icon: DashboardQuizzesNavIcon,
      label: t(locale, "dashboard.welcome.myQuizzes"),
      isActive: Boolean(pathname?.startsWith("/dashboard/quizzes")),
    },
    {
      href: "/dashboard/create",
      icon: DashboardCreateNavIcon,
      label: t(locale, "dashboard.welcome.createQuiz"),
      isActive: Boolean(
        pathname?.startsWith("/dashboard/create") ||
          pathname?.startsWith("/builder") ||
          pathname?.startsWith("/generate"),
      ),
    },
  ];

  const accountLabel = locale === "fr" ? "Compte" : "Account";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label={locale === "fr" ? "Ouvrir le menu" : "Open menu"}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        closeButtonClassName="right-3 top-[calc(env(safe-area-inset-top,0px)+0.875rem)] opacity-90 sm:right-4 sm:top-[calc(env(safe-area-inset-top,0px)+0.625rem)] [&_svg]:size-6"
        className="flex h-full max-h-dvh w-[min(24rem,94vw)] max-w-none flex-col gap-0 overflow-hidden rounded-r-3xl border-border bg-card p-0 shadow-2xl sm:w-[min(26rem,92vw)] 2xl:w-[min(28rem,90vw)]"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div
            className="pointer-events-none shrink-0 bg-transparent h-[env(safe-area-inset-top,0px)] sm:h-[env(safe-area-inset-top,0px)]"
            aria-hidden
          />
          <SheetClose asChild>
            <Link
              href="/dashboard"
              onClick={(event) => interceptLinkClick(event, "/dashboard")}
              className="flex h-14 shrink-0 items-center border-b border-border/60 px-4 transition-colors hover:bg-muted/40"
            >
              <span className="font-black text-lg text-foreground">
                <BrandQuizLinkText />
              </span>
            </Link>
          </SheetClose>
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-3 pb-4">
            <div>
              <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Navigation
              </p>
              <nav className="flex flex-col gap-1" aria-label="Navigation">
                {primaryNav.map((item) => (
                  <DashboardMobileNavSheetLink
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    isActive={item.isActive}
                  />
                ))}
              </nav>
            </div>

            <Separator />

            <div>
              <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {t(locale, "support.helpSection")}
              </p>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    openUserFeedback();
                  }}
                  className={dashboardSidebarNavItemClassName({})}
                >
                  <DashboardFeedbackNavIcon className={dashboardNavIconClassName} />
                  {t(locale, "userFeedback.navLabel")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    openSupportFeedback();
                  }}
                  className={dashboardSidebarNavItemClassName({})}
                >
                  <DashboardSupportNavIcon className={dashboardNavIconClassName} />
                  {t(locale, "support.navLabel")}
                </button>
              </div>
            </div>

            <Separator />

            <div>
              <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {accountLabel}
              </p>
              <div className="flex flex-col gap-1">
                {session?.user?.role === "ADMIN" && (
                  <SheetClose asChild>
                    <Link
                      href="/admin"
                      onClick={(event) => interceptLinkClick(event, "/admin")}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-lg font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Shield className="h-5 w-5 shrink-0" />
                      {t(locale, "userMenu.admin")}
                    </Link>
                  </SheetClose>
                )}
                <SheetClose asChild>
                  <Link
                    href="/account"
                    onClick={(event) => interceptLinkClick(event, "/account")}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-lg font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <User className="h-5 w-5 shrink-0" />
                    {t(locale, "userMenu.account")}
                  </Link>
                </SheetClose>
              </div>
            </div>
            <Separator />
            <DashboardUserPreferencesPanel variant="sheet" />
            <Separator />
            <div className="flex flex-col gap-1">
              <Button variant="destructive" onClick={handleSignOut}>
                {t(locale, "auth.signOut")}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
