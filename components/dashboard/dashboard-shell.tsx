"use client";

import { LegalConsentModal } from "@/components/legal/legal-consent-modal";
import { BuilderNavigationGuardProvider } from "@/components/dashboard/builder-navigation-guard-context";
import { SupportFeedbackProvider } from "@/components/support/support-feedback-provider";

import { DashboardMobileScrollLayout } from "./dashboard-mobile-scroll-layout";
import { Sidebar } from "./sidebar";

type DashboardShellProps = {
  children: React.ReactNode;
  needsLegalConsent?: boolean;
};

export function DashboardShell({
  children,
  needsLegalConsent = false,
}: DashboardShellProps) {
  return (
    <SupportFeedbackProvider>
      <BuilderNavigationGuardProvider>
      <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-card lg:pl-72 2xl:pl-80">
        {/* Sidebar: fixed to viewport on desktop, hidden on mobile (inside Sheet) */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:min-h-0 lg:w-72 lg:flex-col 2xl:w-80">
          <Sidebar className="min-h-0 flex-1" />
        </div>

        {/* Mobile header + scroll region (padding tracks hide-on-scroll header) */}
        <DashboardMobileScrollLayout>{children}</DashboardMobileScrollLayout>

        <LegalConsentModal needsLegalConsent={needsLegalConsent} />
      </div>
      </BuilderNavigationGuardProvider>
    </SupportFeedbackProvider>
  );
}
