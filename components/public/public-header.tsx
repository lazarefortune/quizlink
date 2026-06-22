"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, LayoutDashboard, FileQuestion, Coins, Shield } from "lucide-react";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

import { BrandQuizLinkText } from "@/components/BrandQuizLinkText";
import { PublicMobileNavSheet } from "@/components/public/public-mobile-nav-sheet";
import { ThemeModeDropdown } from "@/components/theme-mode-dropdown";
import { UserMenu } from "@/components/user-menu";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import {
  PUBLIC_HEADER_INNER_HEIGHT_CLASS,
  shouldHidePublicHeader,
} from "@/lib/layout/public-chrome";
import { cn } from "@/lib/utils";

export function PublicHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useLocale();
  const { data: session, update: updateSession } = useSession();

  useEffect(() => {
    const handleSessionUpdate = async () => {
      if (updateSession) {
        try {
          await updateSession({});
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          console.error("Error updating session in PublicHeader:", error);
        }
      }
      router.refresh();
    };

    window.addEventListener("session:update", handleSessionUpdate);
    return () => {
      window.removeEventListener("session:update", handleSessionUpdate);
    };
  }, [router, updateSession]);

  const navItems: Array<{ href: string; label: string; icon: typeof Home }> = [];

  if (session?.user) {
    navItems.push({
      href: "/dashboard",
      label: t(locale, "nav.dashboard"),
      icon: LayoutDashboard,
    });
    if (session.user.role === "ADMIN") {
      navItems.push({
        href: "/admin",
        label: t(locale, "nav.admin"),
        icon: Shield,
      });
    }
  } else {
    navItems.push({ href: "/", label: t(locale, "nav.home"), icon: Home });
  }
  navItems.push({
    href: "/quizzes",
    label: t(locale, "nav.publicQuizzes"),
    icon: FileQuestion,
  });

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return Boolean(pathname?.startsWith(href));
  };

  if (shouldHidePublicHeader(pathname)) {
    return null;
  }

  return (
    <header className="sticky top-0 z-[100] w-full border-b-2 border-border bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div
          className={cn(
            "flex items-center justify-between",
            PUBLIC_HEADER_INNER_HEIGHT_CLASS,
          )}
        >
          <div className="flex items-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
              aria-label={locale === "fr" ? "Retour à l'accueil" : "Back to home"}
            >
              <BrandQuizLinkText size="md" />
            </Link>
          </div>

          <nav className="hidden md:flex md:items-center md:gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-lg font-bold transition-colors hover:text-primary",
                  isActive(item.href)
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {session?.user && (
              <Link
                href="/account/coins"
                className="hidden items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-3 py-2.5 text-primary transition-colors hover:bg-primary/20 md:flex"
              >
                <Coins className="h-6 w-6" />
                <span className="text-base font-medium">
                  {session.user.coinBalance || 0}
                </span>
              </Link>
            )}
            <div className="hidden items-center gap-0.5 rounded-lg border border-border/60 bg-muted/40 py-0.5 pl-0.5 pr-1 dark:bg-muted/20 md:flex">
              <ThemeModeDropdown locale={locale} />
              <div
                className="w-px min-h-6 shrink-0 self-stretch bg-border/60"
                aria-hidden
              />
              <UserMenu />
            </div>

            <PublicMobileNavSheet />
          </div>
        </div>
      </div>
    </header>
  );
}
