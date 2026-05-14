import { describe, expect, it, vi, afterEach } from "vitest";

import { formatBuilderDraftRelativeSavedAt } from "./formatBuilderDraftRelativeSavedAt";

describe("formatBuilderDraftRelativeSavedAt", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns just now for very recent timestamps", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00.000Z"));
    const saved = new Date("2026-01-15T11:59:59.500Z").toISOString();
    expect(formatBuilderDraftRelativeSavedAt(saved, "en")).toBe("just now");
  });

  it("formats past times with relative units", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T14:00:00.000Z"));
    const saved = new Date("2026-01-15T12:00:00.000Z").toISOString();
    const out = formatBuilderDraftRelativeSavedAt(saved, "en");
    expect(out.length).toBeGreaterThan(0);
    expect(out).not.toBe("just now");
  });
});
