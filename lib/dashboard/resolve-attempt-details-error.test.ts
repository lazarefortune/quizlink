import { describe, expect, it } from "vitest";

import { ATTEMPT_DETAILS_ERROR } from "./creator-response-attempts";
import { resolveAttemptDetailsError } from "./resolve-attempt-details-error";

describe("resolveAttemptDetailsError", () => {
  it("maps locked error to localized message", () => {
    expect(resolveAttemptDetailsError("fr", ATTEMPT_DETAILS_ERROR.LOCKED)).toBe(
      "Cette partie fait partie des réponses masquées.",
    );
    expect(resolveAttemptDetailsError("en", ATTEMPT_DETAILS_ERROR.LOCKED)).toBe(
      "This game is part of the locked responses.",
    );
  });

  it("maps purged error to localized long description", () => {
    expect(resolveAttemptDetailsError("fr", ATTEMPT_DETAILS_ERROR.PURGED)).toBe(
      "Les statistiques globales restent conservées, mais les réponses détaillées ont été supprimées lors de la purge automatique.",
    );
    expect(resolveAttemptDetailsError("en", ATTEMPT_DETAILS_ERROR.PURGED)).toBe(
      "Global statistics are still kept, but detailed answers were deleted during automatic purge.",
    );
  });

  it("returns raw error for unknown codes", () => {
    expect(resolveAttemptDetailsError("fr", "Unknown")).toBe("Unknown");
  });
});
