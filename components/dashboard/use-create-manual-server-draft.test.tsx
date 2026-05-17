/** @vitest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockCreateDraftQuizAction = vi.fn();

vi.mock("@/app/(app)/dashboard/create/actions", () => ({
  createDraftQuizAction: (...args: unknown[]) => mockCreateDraftQuizAction(...args),
}));

vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock("@/lib/i18n/use-locale", () => ({
  useLocale: () => ({ locale: "fr" as const }),
}));

import { useCreateManualServerDraft } from "./use-create-manual-server-draft";

describe("useCreateManualServerDraft", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("navigates to the builder when draft creation succeeds", async () => {
    mockCreateDraftQuizAction.mockResolvedValue({ success: true, quizId: "quiz-1" });

    const { result } = renderHook(() => useCreateManualServerDraft());

    let ok = false;
    await act(async () => {
      ok = await result.current.createManualServerDraftAndGoToBuilder("Mon quiz");
    });

    expect(ok).toBe(true);
    expect(mockCreateDraftQuizAction).toHaveBeenCalledWith("fr", "Mon quiz");
    expect(mockPush).toHaveBeenCalledWith("/builder/quiz-1");
  });

  it("returns false and does not navigate when draft creation fails", async () => {
    mockCreateDraftQuizAction.mockResolvedValue({ success: false, error: "failed" });

    const { result } = renderHook(() => useCreateManualServerDraft());

    let ok = true;
    await act(async () => {
      ok = await result.current.createManualServerDraftAndGoToBuilder("Mon quiz");
    });

    expect(ok).toBe(false);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("returns false for empty name without calling the server action", async () => {
    const { result } = renderHook(() => useCreateManualServerDraft());

    let ok = true;
    await act(async () => {
      ok = await result.current.createManualServerDraftAndGoToBuilder("  ");
    });

    expect(ok).toBe(false);
    expect(mockCreateDraftQuizAction).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
