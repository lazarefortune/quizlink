import { describe, expect, it } from "vitest";

import { computeAbandonDurationSeconds } from "./abandon-quiz-attempt";

describe("computeAbandonDurationSeconds", () => {
  it("returns elapsed seconds between startedAt and finishedAt", () => {
    const startedAt = new Date("2026-05-20T10:00:00Z");
    const finishedAt = new Date("2026-05-20T10:01:30Z");
    expect(computeAbandonDurationSeconds(startedAt, finishedAt)).toBe(90);
  });

  it("never returns negative duration", () => {
    const at = new Date("2026-05-20T10:00:00Z");
    expect(computeAbandonDurationSeconds(at, at)).toBe(0);
  });
});
