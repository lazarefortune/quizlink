import { describe, expect, it } from "vitest";
import { buildSharedInitOptions } from "./posthog-provider";

describe("buildSharedInitOptions", () => {
  it("enables native pageviews, pageleave, web vitals, and exception capture without autocapture", () => {
    const options = buildSharedInitOptions();

    expect(options.capture_pageview).toBe("history_change");
    expect(options.capture_pageleave).toBe(true);
    expect(options.capture_performance).toBe(true);
    expect(options.capture_exceptions).toBe(true);
    expect(options.autocapture).toBe(false);
  });
});
