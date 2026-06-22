/* @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@/lib/i18n/use-locale", () => ({
  useLocale: () => ({ locale: "fr" as const }),
}));

vi.mock("@/components/cookie-consent/cookie-consent-context", () => ({
  useCookieConsent: () => ({ openConsentPanel: vi.fn() }),
}));

import { Footer } from "@/components/footer";
import { t } from "@/lib/i18n";

describe("Footer", () => {
  it("shows legal page links", () => {
    render(<Footer />);

    expect(screen.getByRole("link", { name: t("fr", "footer.legal.terms") }).getAttribute("href")).toBe(
      "/legal/terms",
    );
    expect(screen.getByRole("link", { name: t("fr", "footer.legal.sales") }).getAttribute("href")).toBe(
      "/legal/sales",
    );
    expect(screen.getByRole("link", { name: t("fr", "footer.legal.privacy") }).getAttribute("href")).toBe(
      "/legal/privacy",
    );
    expect(screen.getByRole("link", { name: t("fr", "footer.legal.cookies") }).getAttribute("href")).toBe(
      "/legal/cookies",
    );
    expect(screen.getByRole("link", { name: t("fr", "footer.legal.legalNotice") }).getAttribute("href")).toBe(
      "/legal",
    );
  });
});
