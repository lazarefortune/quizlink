"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Coins, ArrowUp } from "lucide-react";

import { useBuilderNavigationGuard } from "@/components/dashboard/builder-navigation-guard-context";
import { cn } from "@/lib/utils";
import { BrandQuizLinkText } from "@/components/BrandQuizLinkText";

import { DashboardMobileNavSheet } from "./dashboard-mobile-nav-sheet";

type TopbarProps = {
  className?: string;
  isHeaderVisible: boolean;
  isScrolledDown: boolean;
};

export function Topbar({
  className,
  isHeaderVisible,
  isScrolledDown,
}: TopbarProps) {
  const { data: session } = useSession();
  const { interceptLinkClick } = useBuilderNavigationGuard();

  const scrollToTop = () => {
    const root = document.getElementById("dashboard-main-scroll");
    if (root) {
      root.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between gap-2 border-b border-border/60 bg-background/95 px-4 backdrop-blur-sm transition-transform duration-300 ease-in-out sm:h-14 sm:px-4 lg:hidden",
          "pt-[env(safe-area-inset-top,0px)]",
          isHeaderVisible ? "translate-y-0" : "-translate-y-full",
          className,
        )}
        role="banner"
      >
        <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
          <DashboardMobileNavSheet />
          <Link
            href="/dashboard"
            onClick={(event) => interceptLinkClick(event, "/dashboard")}
            className="flex min-w-0 items-center gap-2"
          >
            <span className="truncate font-black text-xl text-foreground">
              <BrandQuizLinkText />
            </span>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {session?.user && (
            <Link
              href="/account/coins"
              onClick={(event) => interceptLinkClick(event, "/account/coins")}
              className="flex items-center gap-1.5 rounded-xl border-2 border-border bg-muted/40 px-2 py-1.5 font-bold text-foreground transition-colors hover:bg-muted/60 max-[380px]:gap-1 max-[380px]:px-1.5 max-[380px]:py-1 sm:px-2.5"
            >
              <Coins className="h-5 w-5 shrink-0 text-blue" />
              <span className="font-black tabular-nums text-base text-blue sm:text-sm">
                {session.user.coinBalance ?? 0}
              </span>
            </Link>
          )}
        </div>
      </header>

      {/* Scroll-to-top — mobile only, appears after scrolling down */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Remonter en haut de la page"
        className={cn(
          "fixed bottom-6 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 lg:hidden",
          isScrolledDown
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0",
        )}
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </>
  );
}
