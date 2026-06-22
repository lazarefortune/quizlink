/* @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n/use-locale", () => ({
  useLocale: () => ({ locale: "fr" as const }),
}));

import { PaymentLegalNotice } from "@/components/legal/payment-legal-notice";
import { t } from "@/lib/i18n";

describe("PaymentLegalNotice", () => {
  it("links to CGV and privacy policy", () => {
    render(<PaymentLegalNotice />);

    expect(screen.getByTestId("payment-legal-notice").textContent).toContain(
      t("fr", "legal.paymentNotice.prefix"),
    );
    expect(screen.getByRole("link", { name: t("fr", "legal.paymentNotice.salesLink") }).getAttribute("href")).toBe(
      "/legal/sales",
    );
    expect(screen.getByRole("link", { name: t("fr", "legal.paymentNotice.privacyLink") }).getAttribute("href")).toBe(
      "/legal/privacy",
    );
  });
});
