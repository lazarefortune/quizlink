/* @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PublicMobileNavSheet } from "./public-mobile-nav-sheet";

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null }),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
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

describe("PublicMobileNavSheet", () => {
  it("renders menu trigger with accessible label", () => {
    render(<PublicMobileNavSheet />);

    expect(screen.getByRole("button", { name: /Open menu/i })).toBeInTheDocument();
  });
});
