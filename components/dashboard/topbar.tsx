"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Coins, ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";

import { DashboardMobileNavSheet } from "./dashboard-mobile-nav-sheet";
import { useScrollBehavior } from "./useScrollBehavior";

type TopbarProps = {
  className?: string;
};

export function Topbar({ className }: TopbarProps) {
  const { data: session } = useSession();
  const { isHeaderVisible, isScrolledDown } = useScrollBehavior();

  const scrollToTop = () => {
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
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
            <span className="truncate font-black text-xl text-foreground">
              Quiz<span className="text-primary">Link</span>
            </span>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {session?.user && (
            <Link
              href="/account/coins"
              className="flex items-center gap-1.5 rounded-xl border-2 border-border bg-muted/40 px-2 py-1.5 font-bold text-foreground transition-colors hover:bg-muted/60 max-[380px]:gap-1 max-[380px]:px-1.5 max-[380px]:py-1 sm:px-2.5"
            >
              <Coins className="h-5 w-5 shrink-0 text-blue" />
              <span className="font-black tabular-nums text-base text-blue sm:text-sm">
                {session.user.coinBalance ?? 0}
              </span>
            </Link>
          )}
          <DashboardMobileNavSheet />
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
