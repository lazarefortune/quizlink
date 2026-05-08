"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Coins } from "lucide-react";

import { cn } from "@/lib/utils";

import { DashboardMobileNavSheet } from "./dashboard-mobile-nav-sheet";

type TopbarProps = {
  className?: string;
};

export function Topbar({ className }: TopbarProps) {
  const { data: session } = useSession();

  return (
    <header
      className={cn(
        "flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-background px-3 pt-[env(safe-area-inset-top,0px)] sm:h-14 sm:px-4 lg:hidden",
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
            className="flex max-[380px]:gap-1 max-[380px]:px-1.5 max-[380px]:py-1 items-center gap-1.5 rounded-xl border-2 border-border bg-muted/40 px-2 py-1.5 font-bold text-foreground transition-colors hover:bg-muted/60 sm:px-2.5"
          >
            <Coins className="h-5 w-5 shrink-0 text-blue sm:h-5 sm:w-5" />
            <span className="font-black tabular-nums text-base text-blue sm:text-sm">
              {session.user.coinBalance ?? 0}
            </span>
          </Link>
        )}
        <DashboardMobileNavSheet />
      </div>
    </header>
  );
}
