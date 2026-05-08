"use client";

import { useState } from "react";
import type { ElementType } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileText,
  House,
  Menu,
  Plus,
  Shield,
  User,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import { ThemeSegmentedControl } from "@/components/admin/theme-segmented-control";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";

import { DashboardMobileNavSheetLink } from "./dashboard-mobile-nav-sheet-link";

export function DashboardMobileNavSheet() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const { locale } = useLocale();
  const router = useRouter();

  const handleSignOut = async () => {
    setOpen(false);
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  };

  const primaryNav: Array<{
    href: string;
    icon: ElementType;
    label: string;
    isActive: boolean;
  }> = [
    {
      href: "/dashboard",
      icon: House,
      label: t(locale, "dashboard.sidebar.overview"),
      isActive: pathname === "/dashboard",
    },
    {
      href: "/dashboard/quizzes",
      icon: FileText,
      label: t(locale, "dashboard.welcome.myQuizzes"),
      isActive: Boolean(pathname?.startsWith("/dashboard/quizzes")),
    },
    {
      href: "/dashboard/create",
      icon: Plus,
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
        side="right"
        closeButtonClassName="right-3 top-[calc(env(safe-area-inset-top,0px)+0.875rem)] opacity-90 sm:right-4 sm:top-[calc(env(safe-area-inset-top,0px)+0.625rem)] [&_svg]:size-6"
        className="flex h-full max-h-dvh w-[min(24rem,94vw)] max-w-none flex-col gap-0 overflow-hidden rounded-l-3xl border-border bg-card p-0 shadow-2xl sm:w-[min(26rem,92vw)] 2xl:w-[min(28rem,90vw)]"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div
            className="pointer-events-none shrink-0 bg-transparent h-[env(safe-area-inset-top,0px)] sm:h-[env(safe-area-inset-top,0px)]"
            aria-hidden
          />
          <SheetClose asChild>
            <Link
              href="/dashboard"
              className="flex h-14 shrink-0 items-center border-b border-border/60 px-4 transition-colors hover:bg-muted/40"
            >
              <span className="font-black text-lg text-foreground">
                Quiz<span className="text-primary">Link</span>
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
                {accountLabel}
              </p>
              <div className="flex flex-col gap-1">
                {session?.user?.role === "ADMIN" && (
                  <SheetClose asChild>
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-base font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Shield className="h-5 w-5 shrink-0" />
                      {t(locale, "userMenu.admin")}
                    </Link>
                  </SheetClose>
                )}
                <SheetClose asChild>
                  <Link
                    href="/account"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-base font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <User className="h-5 w-5 shrink-0" />
                    {t(locale, "userMenu.account")}
                  </Link>
                </SheetClose>
              </div>
            </div>
            <Separator />
            <div className="flex flex-col gap-1">
              <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {t(locale, "userMenu.theme")}
              </p>
              <div>
                <ThemeSegmentedControl locale={locale} />
              </div>
            </div>
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
