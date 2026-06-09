/* @vitest-environment jsdom */

import type { ComponentPropsWithoutRef } from "react";

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardUserMenu } from "./dashboard-user-menu";

vi.mock("@/components/ui/dropdown-menu", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/components/ui/dropdown-menu")>();
  const { DropdownMenu: DropdownMenuRoot } = mod;
  return {
    ...mod,
    DropdownMenu: (props: ComponentPropsWithoutRef<typeof DropdownMenuRoot>) => (
      <DropdownMenuRoot {...props} open />
    ),
  };
});

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

vi.mock("@/lib/i18n/use-persist-locale-preference", () => ({
  usePersistLocalePreference: () => ({
    locale: "en",
    setLocale: vi.fn(),
  }),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "system", setTheme: vi.fn() }),
}));

vi.mock("@/lib/i18n", () => ({
  t: (_locale: string, key: string) => key,
}));

vi.mock("@/components/user-avatar/user-avatar-context", () => ({
  useUserAvatar: () => ({
    avatar: "<svg>avatar</svg>",
    backgroundColor: "c8bfe8",
  }),
}));

describe("DashboardUserMenu", () => {
  it("renders sidebar trigger with user display name", () => {
    render(<DashboardUserMenu />);

    expect(
      screen.getByRole("button", { name: /Ada Lovelace/i, hidden: true }),
    ).toBeInTheDocument();
  });

  it("shows admin link for ADMIN when hideAdminLink is false", () => {
    render(<DashboardUserMenu />);

    expect(screen.getByRole("menuitem", { name: "userMenu.admin" })).toHaveAttribute(
      "href",
      "/admin",
    );
  });

  it("shows theme and language preference controls", () => {
    render(<DashboardUserMenu />);

    expect(screen.getByText("userMenu.theme")).toBeInTheDocument();
    expect(screen.getByText("userMenu.language")).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Interface language" })).toBeInTheDocument();
  });

  it("hides admin link when hideAdminLink is true", () => {
    render(<DashboardUserMenu hideAdminLink />);

    expect(screen.getByRole("menuitem", { name: "userMenu.account" })).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "userMenu.admin" }),
    ).not.toBeInTheDocument();
  });
});
