/* @vitest-environment jsdom */

import type { ReactNode } from "react";

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardMobileNavSheet } from "./dashboard-mobile-nav-sheet";

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: {
        name: "Ada Lovelace",
        role: "USER",
      },
    },
  }),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/i18n/use-locale", () => ({
  useLocale: () => ({ locale: "en" }),
}));

vi.mock("@/lib/i18n/use-persist-locale-preference", () => ({
  usePersistLocalePreference: () => ({
    locale: "en",
    setLocale: vi.fn(),
  }),
}));

vi.mock("@/lib/i18n", () => ({
  t: (_locale: string, key: string) => key,
}));

vi.mock("@/components/support/support-feedback-provider", () => ({
  useSupportFeedback: () => ({
    openUserFeedback: vi.fn(),
    openSupportFeedback: vi.fn(),
  }),
  SupportFeedbackProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("@/components/dashboard/builder-navigation-guard-context", () => ({
  useBuilderNavigationGuard: () => ({
    setBuilderHasUnsavedChanges: vi.fn(),
    interceptLinkClick: () => false,
    requestNavigate: vi.fn(),
    requestAction: (action: () => void | Promise<void>) => {
      void Promise.resolve(action());
    },
    runNavigationBypass: (fn: () => void) => fn(),
  }),
  BuilderNavigationGuardProvider: ({ children }: { children: ReactNode }) =>
    children,
}));

describe("DashboardMobileNavSheet", () => {
  it("renders menu trigger with accessible label", () => {
    render(<DashboardMobileNavSheet />);

    expect(screen.getByRole("button", { name: /Open menu/i })).toBeInTheDocument();
  });
});
