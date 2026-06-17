/* @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n/use-locale", () => ({
  useLocale: () => ({ locale: "fr" as const }),
}));

vi.mock("@/app/(app)/account/manage-pro-subscription-button", () => ({
  ManageProSubscriptionButton: () => (
    <button type="button" data-testid="manage-pro-subscription-button">
      Gérer mon abonnement
    </button>
  ),
}));

import { t } from "@/lib/i18n";
import { PRO_MONTHLY_INCLUDED_COINS, PRO_MONTHLY_PRICE_EUR } from "@/lib/subscription/proSubscriptionConstants";
import { CoinsProSubscriptionCard } from "./coins-pro-subscription-card";

const inactiveProAccess = {
  isActive: false,
  plan: null,
  status: null,
  currentPeriodEnd: null,
  subscriptionId: null,
  expiresAt: null,
} as const;

const activeProAccess = {
  isActive: true,
  plan: "PRO" as const,
  status: "ACTIVE" as const,
  currentPeriodEnd: new Date("2027-06-01"),
  subscriptionId: "sub-1",
  expiresAt: new Date("2027-06-01"),
};

describe("CoinsProSubscriptionCard", () => {
  it("shows price, benefits and upgrade button when Pro is inactive", () => {
    render(
      <CoinsProSubscriptionCard
        proAccess={inactiveProAccess}
        isProAvailable
        isStartingProCheckout={false}
        onStartProCheckout={vi.fn()}
      />,
    );

    expect(screen.getByTestId("coins-pro-subscription-card")).toBeTruthy();
    expect(screen.getByText(`${PRO_MONTHLY_PRICE_EUR}€`)).toBeTruthy();
    expect(screen.getByText(t("fr", "account.subscription.perMonth"))).toBeTruthy();
    expect(
      screen.getByText(t("fr", "account.subscription.allQuizzesUnlocked")),
    ).toBeTruthy();
    expect(
      screen.getByText(
        t("fr", "account.subscription.monthlyCoinsIncluded", {
          coins: PRO_MONTHLY_INCLUDED_COINS,
        }),
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: t("fr", "account.subscription.upgradeToPro") }),
    ).toBeTruthy();
  });

  it("shows manage button and renewal info when Pro is active", () => {
    render(
      <CoinsProSubscriptionCard
        proAccess={activeProAccess}
        isProAvailable
        isStartingProCheckout={false}
        onStartProCheckout={vi.fn()}
      />,
    );

    expect(screen.getByText(t("fr", "account.subscription.activeBadge"))).toBeTruthy();
    expect(screen.getByTestId("manage-pro-subscription-button")).toBeTruthy();
    expect(screen.queryByText(`${PRO_MONTHLY_PRICE_EUR}€`)).toBeNull();
  });
});
