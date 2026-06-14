/* @vitest-environment jsdom */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n/use-locale", () => ({
  useLocale: () => ({ locale: "fr" as const }),
}));

vi.mock("@/components/ui/playful-section-title", () => ({
  PlayfulSectionTitle: ({
    children,
    as: Tag = "h2",
    className,
  }: {
    children: React.ReactNode;
    as?: "h2" | "h3";
    className?: string;
  }) => {
    const Element = Tag;
    return <Element className={className}>{children}</Element>;
  },
}));

import { LockedAdvancedStatsCard } from "./locked-advanced-stats-card";
import { t } from "@/lib/i18n";

describe("LockedAdvancedStatsCard", () => {
  it("renders teaser copy and unlock CTA without data props", () => {
    const onUnlockClick = vi.fn();
    render(<LockedAdvancedStatsCard onUnlockClick={onUnlockClick} />);

    expect(screen.getByTestId("locked-advanced-stats-card")).toBeTruthy();
    expect(screen.getByText("Statistiques avancées")).toBeTruthy();
    expect(screen.getByText("Analyse par question")).toBeTruthy();
    expect(screen.getByText("Export CSV bientôt")).toBeTruthy();
    expect(screen.getByTestId("locked-advanced-stats-preview")).toBeTruthy();
    expect(screen.getByTestId("locked-advanced-stats-blur-layer")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: t("fr", "dashboard.unlockDialog.unlockStats") }),
    );
    expect(onUnlockClick).toHaveBeenCalled();
  });

  it("does not accept or render real advanced stats props", () => {
    const source = readFileSync(
      resolve(process.cwd(), "components/dashboard/quiz-detail/locked-advanced-stats-card.tsx"),
      "utf8",
    );
    expect(source).not.toMatch(/insights|questionInsights|totalOpenCount|globalBestScore/);
    expect(source).toContain("onUnlockClick");
    expect(source).not.toMatch(/insights\?:/);
  });
});
