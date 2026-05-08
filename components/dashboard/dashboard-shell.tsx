"use client";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-card lg:pl-80 2xl:pl-96">
      {/* Sidebar: fixed to viewport on desktop, hidden on mobile (inside Sheet) */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-80 lg:flex-col 2xl:w-96">
        <Sidebar className="flex-1" />
      </div>

      {/* Mobile header */}
      <Topbar />

      {/* Content panel — padding-top on mobile compensates for the fixed header */}
      <main className="flex flex-1 flex-col bg-background pt-16 sm:pt-14 lg:pt-0 lg:rounded-tl-3xl lg:border-l lg:border-t lg:border-border dark:lg:border-border">
        {children}
      </main>
    </div>
  );
}
