"use client";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="hidden min-h-0 w-80 shrink-0 flex-col bg-card 2xl:w-96 lg:flex">
          <Sidebar className="min-h-0 flex-1" />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background lg:rounded-l-3xl lg:border lg:border-border dark:lg:border-border">
          <Topbar />
          <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
