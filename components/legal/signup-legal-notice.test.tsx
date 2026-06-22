/* @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n/use-locale", () => ({
  useLocale: () => ({ locale: "fr" as const }),
}));

import { SignupLegalNotice } from "@/components/legal/signup-legal-notice";
import { t } from "@/lib/i18n";

describe("SignupLegalNotice", () => {
  it("renders a single global legal notice with links to terms and privacy", () => {
    render(<SignupLegalNotice />);

    expect(screen.getAllByTestId("signup-legal-notice")).toHaveLength(1);
    expect(screen.getByTestId("signup-legal-notice").textContent).toContain(
      t("fr", "auth.signUp.legalNoticePrefix"),
    );
    expect(
      screen.getByRole("link", { name: t("fr", "auth.signUp.legalNoticeTermsLink") }).getAttribute("href"),
    ).toBe("/legal/terms");
    expect(
      screen.getByRole("link", { name: t("fr", "auth.signUp.legalNoticePrivacyLink") }).getAttribute("href"),
    ).toBe("/legal/privacy");
  });
});
