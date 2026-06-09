"use client";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { Topbar } from "./topbar";
import { useScrollBehavior } from "./useScrollBehavior";

type DashboardMobileScrollLayoutProps = {
  children: React.ReactNode;
};

export function DashboardMobileScrollLayout({
  children,
}: DashboardMobileScrollLayoutProps) {
  const pathname = usePathname();
  const isBuilderRoute = pathname?.startsWith("/builder") ?? false;
  const { isHeaderVisible, isScrolledDown } = useScrollBehavior();

  return (
    <>
      <Topbar isHeaderVisible={isHeaderVisible} isScrolledDown={isScrolledDown} />
      <main
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden bg-background lg:rounded-l-3xl lg:border lg:border-border dark:lg:border-border",
          "lg:pt-0",
          isHeaderVisible ? "pt-16 sm:pt-14" : "pt-0",
          "transition-[padding-top] duration-300 ease-in-out lg:transition-none",
        )}
      >
        <div
          id="dashboard-main-scroll"
          className={cn(
            "min-h-0 flex-1 basis-0 overflow-y-auto overflow-x-hidden overscroll-y-contain",
            "pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0",
            isBuilderRoute &&
              "lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden",
          )}
        >
          {children}
        </div>
      </main>
    </>
  );
}
