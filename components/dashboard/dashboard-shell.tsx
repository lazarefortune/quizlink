"use client";

import { LegalConsentModal } from "@/components/legal/legal-consent-modal";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

type DashboardShellProps = {
  children: React.ReactNode;
  needsLegalConsent?: boolean;
};

export function DashboardShell({
  children,
  needsLegalConsent = false,
}: DashboardShellProps) {
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-card lg:pl-72 2xl:pl-80">
      {/* Sidebar: fixed to viewport on desktop, hidden on mobile (inside Sheet) */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:min-h-0 lg:w-72 lg:flex-col 2xl:w-80">
        <Sidebar className="min-h-0 flex-1" />
      </div>

      {/* Mobile header */}
      <Topbar />

      {/* Panel: rounded shell stays fixed; only inner area scrolls */}
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background pt-16 sm:pt-14 lg:pt-0 lg:rounded-l-3xl lg:border lg:border-border dark:lg:border-border">
        <div
          id="dashboard-main-scroll"
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain"
        >
          {children}
        </div>
      </main>

      <LegalConsentModal needsLegalConsent={needsLegalConsent} />
    </div>
  );
}
