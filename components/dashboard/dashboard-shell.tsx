"use client";

import { LegalConsentModal } from "@/components/legal/legal-consent-modal";
import { BuilderNavigationGuardProvider } from "@/components/dashboard/builder-navigation-guard-context";
import {
  DashboardSidebarLayoutProvider,
  useDashboardSidebarLayout,
} from "@/components/dashboard/dashboard-sidebar-layout-context";
import { SupportFeedbackProvider } from "@/components/support/support-feedback-provider";
import { cn } from "@/lib/utils";

import { UserAvatarProvider } from "@/components/user-avatar/user-avatar-context";

import { DashboardMobileScrollLayout } from "./dashboard-mobile-scroll-layout";
import { Sidebar } from "./sidebar";

type DashboardShellProps = {
  children: React.ReactNode;
  needsLegalConsent?: boolean;
  userAvatar?: string | null;
  userAvatarBackgroundColor?: string;
};

function DashboardShellInner({
  children,
  needsLegalConsent = false,
}: DashboardShellProps) {
  const { isCollapsed } = useDashboardSidebarLayout();

  return (
    <div
      className={cn(
        "flex h-dvh min-h-0 flex-col overflow-hidden bg-card",
        "transition-[padding-left] duration-200 ease-out",
        isCollapsed ? "lg:pl-[4.5rem]" : "lg:pl-72 2xl:pl-80",
      )}
    >
      <div
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:min-h-0 lg:flex-col",
          "transition-[width] duration-200 ease-out",
          isCollapsed ? "lg:w-[4.5rem] 2xl:w-[4.5rem]" : "lg:w-72 2xl:w-80",
        )}
      >
        <Sidebar className="min-h-0 flex-1" />
      </div>

      <DashboardMobileScrollLayout>{children}</DashboardMobileScrollLayout>

      <LegalConsentModal needsLegalConsent={needsLegalConsent} />
    </div>
  );
}

export function DashboardShell({
  children,
  needsLegalConsent = false,
  userAvatar = null,
  userAvatarBackgroundColor,
}: DashboardShellProps) {
  return (
    <SupportFeedbackProvider>
      <BuilderNavigationGuardProvider>
        <DashboardSidebarLayoutProvider>
          <UserAvatarProvider
            avatar={userAvatar}
            backgroundColor={userAvatarBackgroundColor}
          >
            <DashboardShellInner needsLegalConsent={needsLegalConsent}>
              {children}
            </DashboardShellInner>
          </UserAvatarProvider>
        </DashboardSidebarLayoutProvider>
      </BuilderNavigationGuardProvider>
    </SupportFeedbackProvider>
  );
}
