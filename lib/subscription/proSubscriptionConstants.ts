export const PRO_MONTHLY_INCLUDED_COINS = 100;

export const PRO_MONTHLY_PRICE_EUR = 9.90;

export const PRO_PLAN_NAME = "QuizLink Pro";

export const COINS_PAGE_PRO_BENEFIT_KEYS = [
  "account.subscription.allQuizzesUnlocked",
  "account.subscription.advancedStatsAvailable",
  "dashboard.unlockDialog.benefitViewAllResponses",
  "account.subscription.monthlyCoinsIncluded",
] as const;

export type CoinsPageProBenefitKey = (typeof COINS_PAGE_PRO_BENEFIT_KEYS)[number];

