/* @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  SupportFeedbackProvider,
  useSupportFeedback,
} from "./support-feedback-provider";

vi.mock("@/app/feedback/actions", () => ({
  createFeedbackAction: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/components/user-feedback/user-feedback-modal", () => ({
  UserFeedbackModal: () => null,
}));

vi.mock("@/lib/i18n/use-locale", () => ({
  useLocale: () => ({ locale: "fr" }),
}));

vi.mock("@/lib/i18n", () => ({
  t: (_locale: string, key: string) => key,
}));

vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/builder/quiz_1",
}));

function OpenSupportButtons() {
  const { openSupportFeedback } = useSupportFeedback();

  return (
    <div>
      <button type="button" onClick={() => openSupportFeedback()}>
        open-classic
      </button>
      <button
        type="button"
        onClick={() =>
          openSupportFeedback({
            type: "SAVE_ERROR_REPORT",
            metadata: { source: "builder_save_error", phase: "manual_save" },
            quizId: "quiz_1",
          })
        }
      >
        open-preset
      </button>
    </div>
  );
}

describe("SupportFeedbackProvider", () => {
  it("opens classic support modal without preset", () => {
    render(
      <SupportFeedbackProvider>
        <OpenSupportButtons />
      </SupportFeedbackProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "open-classic" }));

    expect(screen.getByText("support.title")).toBeInTheDocument();
    expect(screen.getByText("support.form.typeLabel")).toBeInTheDocument();
  });

  it("opens support modal with SAVE_ERROR_REPORT preset", () => {
    render(
      <SupportFeedbackProvider>
        <OpenSupportButtons />
      </SupportFeedbackProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "open-preset" }));

    expect(screen.getByText("support.reportIssue")).toBeInTheDocument();
    expect(screen.getByText("support.metadataAttached")).toBeInTheDocument();
    expect(screen.queryByLabelText(/support.form.typeLabel/i)).not.toBeInTheDocument();
  });
});
