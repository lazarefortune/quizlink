/* @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n/use-locale", () => ({
  useLocale: () => ({ locale: "fr" as const }),
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    className,
    ...props
  }: {
    src: string;
    alt: string;
    className?: string;
    "data-testid"?: string;
  }) => (
    <img src={src} alt={alt} className={className} {...props} />
  ),
}));

import { t } from "@/lib/i18n";
import { resolveCoinPackBenefitCounts } from "@/lib/coins/coinPackBenefits";
import { CoinPackOfferCard } from "./coin-pack-offer-card";

const pack = {
  id: "pack-80",
  displayName: "Pack Pro",
  coins: 80,
  price: 12,
  isPopular: true,
};

describe("CoinPackOfferCard", () => {
  it("highlights coins over price and shows real pack benefits", () => {
    const benefits = resolveCoinPackBenefitCounts(pack.coins);

    render(
      <CoinPackOfferCard
        pack={pack}
        isLoading={false}
        isAnyPackLoading={false}
        onPurchase={vi.fn()}
      />,
    );

    expect(screen.getByText("80")).toBeTruthy();
    expect(screen.getByText("12€")).toBeTruthy();
    const duoIcon = screen.getByTestId("coin-pack-coins-icon-duo");
    expect(duoIcon).toBeTruthy();
    expect(duoIcon.getAttribute("src")).toBe("/coins-two.png");
    expect(screen.queryByTestId("coin-pack-coins-icon-multiple")).toBeNull();
    expect(
      screen.getByText(
        t("fr", "account.coins.packBenefitAiGenerations", {
          count: benefits.aiGenerations,
        }),
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        t("fr", "account.coins.packBenefitQuizUnlocks", {
          count: benefits.quizUnlocks,
        }),
      ),
    ).toBeTruthy();
    expect(screen.getByTestId("coin-pack-popular-badge")).toBeTruthy();
    expect(screen.getByTestId("payment-legal-notice")).toBeTruthy();
  });

  it("uses the multiple coins asset for larger packs", () => {
    render(
      <CoinPackOfferCard
        pack={{ ...pack, coins: 300, isPopular: false }}
        isLoading={false}
        isAnyPackLoading={false}
        onPurchase={vi.fn()}
      />,
    );

    const multipleIcon = screen.getByTestId("coin-pack-coins-icon-multiple");
    expect(multipleIcon).toBeTruthy();
    expect(multipleIcon.getAttribute("src")).toBe("/coins-multiple.svg");
  });
});
