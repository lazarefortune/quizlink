/* @vitest-environment jsdom */

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

vi.mock("@/lib/i18n", () => ({
  t: (_locale: string, key: string) => key,
}));

describe("DashboardMobileNavSheet", () => {
  it("renders menu trigger with accessible label", () => {
    render(<DashboardMobileNavSheet />);

    expect(screen.getByRole("button", { name: /Open menu/i })).toBeInTheDocument();
  });
});
