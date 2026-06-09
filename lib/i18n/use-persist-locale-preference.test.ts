/* @vitest-environment jsdom */

import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { usePersistLocalePreference } from "./use-persist-locale-preference";

const setLocale = vi.fn();

vi.mock("./use-locale", () => ({
  useLocale: () => ({ locale: "fr", setLocale }),
}));

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

vi.mock("@/app/(app)/account/actions", () => ({
  updatePreferredLanguage: vi.fn(),
}));

import { useSession } from "next-auth/react";
import { updatePreferredLanguage } from "@/app/(app)/account/actions";

describe("usePersistLocalePreference", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates locale locally for guests without persisting to the server", () => {
    vi.mocked(useSession).mockReturnValue({ data: null } as ReturnType<
      typeof useSession
    >);

    const { result } = renderHook(() => usePersistLocalePreference());

    act(() => {
      result.current.setLocale("en");
    });

    expect(setLocale).toHaveBeenCalledWith("en");
    expect(updatePreferredLanguage).not.toHaveBeenCalled();
  });

  it("persists locale when the user is signed in", () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: "user-1" } },
    } as ReturnType<typeof useSession>);

    const { result } = renderHook(() => usePersistLocalePreference());

    act(() => {
      result.current.setLocale("en");
    });

    expect(setLocale).toHaveBeenCalledWith("en");
    expect(updatePreferredLanguage).toHaveBeenCalledWith("en");
  });
});
