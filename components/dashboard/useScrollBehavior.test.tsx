/** @vitest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  isNearScrollBottom,
  resolveHeaderVisibility,
  useScrollBehavior,
} from "./useScrollBehavior";

describe("isNearScrollBottom", () => {
  it("returns true when the viewport is within the bottom threshold", () => {
    const root = document.createElement("div");
    Object.defineProperties(root, {
      scrollTop: { configurable: true, value: 900 },
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 1000 },
    });

    expect(isNearScrollBottom(root)).toBe(true);
  });
});

describe("resolveHeaderVisibility", () => {
  it("does not force the header visible when near the bottom", () => {
    expect(
      resolveHeaderVisibility({
        delta: -20,
        currentY: 900,
        isNearBottom: true,
      }),
    ).toBeNull();
  });

  it("shows the header again when scrolling up away from the bottom", () => {
    expect(
      resolveHeaderVisibility({
        delta: -20,
        currentY: 400,
        isNearBottom: false,
      }),
    ).toBe(true);
  });
});

describe("useScrollBehavior", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("uses dashboard-main-scroll scrollTop when the scroll root exists", async () => {
    const root = document.createElement("div");
    root.id = "dashboard-main-scroll";
    Object.defineProperty(root, "scrollTop", {
      configurable: true,
      get: () => 400,
      set: vi.fn(),
    });
    document.body.appendChild(root);

    const { result } = renderHook(() => useScrollBehavior());

    await act(async () => {
      vi.runAllTimers();
    });

    expect(result.current.isScrolledDown).toBe(true);
  });

  it("falls back to window scroll when scroll root is missing", async () => {
    vi.spyOn(window, "scrollY", "get").mockReturnValue(400);

    const { result } = renderHook(() => useScrollBehavior());

    await act(async () => {
      vi.runAllTimers();
    });

    expect(result.current.isScrolledDown).toBe(true);
  });
});
