/* @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardUserMenu } from "./dashboard-user-menu";

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: {
        name: "Ada Lovelace",
        email: "ada@example.com",
        role: "ADMIN",
        coinBalance: 12,
      },
    },
  }),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
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

describe("DashboardUserMenu", () => {
  it("renders sidebar trigger with user display name", () => {
    render(<DashboardUserMenu />);

    expect(screen.getByRole("button", { name: /Ada Lovelace/i })).toBeInTheDocument();
  });
});
