/** @vitest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useScrollBehavior } from "./useScrollBehavior";

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
