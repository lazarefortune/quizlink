import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const LEGACY_WORDING_PATTERNS = [
  /prolonger/i,
  /réactiver/i,
  /2 mois/i,
  /lien expiré/i,
  /extend this quiz/i,
  /reactivate/i,
  /expired link/i,
];

const MAIN_QUOTA_UI_FILES = [
  "components/dashboard/quiz-quota-badge.tsx",
  "components/dashboard/quiz-list-card.tsx",
  "components/dashboard/quiz-detail/quiz-share-link-dialog.tsx",
  "components/dashboard/quiz-detail/quiz-unlock-paywall-dialog.tsx",
  "components/dashboard/quiz-detail/quiz-detail-header.tsx",
  "app/quiz/[token]/quiz-introduction-content.tsx",
];

describe("quota UI legacy wording regression", () => {
  for (const relativePath of MAIN_QUOTA_UI_FILES) {
    it(`does not expose legacy expiration wording in ${relativePath}`, () => {
      const source = readFileSync(resolve(process.cwd(), relativePath), "utf8");

      for (const pattern of LEGACY_WORDING_PATTERNS) {
        expect(source).not.toMatch(pattern);
      }
    });
  }
});
