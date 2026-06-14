import { describe, expect, it } from "vitest";

import { t } from "./index";

const LEGACY_PUBLIC_WORDING_PATTERNS = [
  /prolonger/i,
  /réactiver/i,
  /2 mois/i,
  /60 jours/i,
  /campagne 7/i,
  /lien expiré/i,
  /débloqué jusqu/i,
  /reactivate/i,
  /extend this quiz/i,
  /2 months/i,
  /60 days/i,
  /illimité/i,
  /\bunlimited participants\b/i,
];

const PUBLIC_QUOTA_KEYS = [
  "landing.hero.subtitle",
  "landing.finalCta.subtitle",
  "landing.whyQuizLink.noDisposable.description",
  "landing.whyQuizLink.realResults.description",
  "landing.features.statistics.description",
  "account.coins.subtitle",
  "account.coins.shopSubtitle",
  "account.subscription.proDescription",
  "account.subscription.allQuizzesUnlocked",
  "pricing.subtitle",
  "pricing.coinsUseCaseUnlock",
  "dashboard.home.coinsDescription",
] as const;

describe("public quota wording", () => {
  for (const locale of ["fr", "en"] as const) {
    for (const key of PUBLIC_QUOTA_KEYS) {
      it(`does not expose legacy model wording in ${locale} ${key}`, () => {
        const text = t(locale, key);

        for (const pattern of LEGACY_PUBLIC_WORDING_PATTERNS) {
          expect(text).not.toMatch(pattern);
        }
      });
    }
  }

  it("uses the central product message on the landing hero (fr)", () => {
    expect(t("fr", "landing.hero.subtitle")).toContain("20");
  });
});
