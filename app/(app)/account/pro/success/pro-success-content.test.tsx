/* @vitest-environment jsdom */

import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const getProCheckoutSessionDetailsMock = vi.fn();
const getProSubscriptionAccessActionMock = vi.fn();

vi.mock("@/lib/i18n/use-locale", () => ({
  useLocale: () => ({ locale: "fr" as const }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/ui/celebration-confetti", () => ({
  fireCelebrationConfetti: vi.fn(),
}));

vi.mock("@/app/(app)/account/pro-subscription/actions", () => ({
  getProCheckoutSessionDetails: (...args: unknown[]) =>
    getProCheckoutSessionDetailsMock(...args),
  getProSubscriptionAccessAction: (...args: unknown[]) =>
    getProSubscriptionAccessActionMock(...args),
}));

vi.mock("@/app/(app)/account/manage-pro-subscription-button", () => ({
  ManageProSubscriptionButton: () => (
    <button type="button" data-testid="manage-pro-subscription-button">
      Gérer mon abonnement
    </button>
  ),
}));

import { t } from "@/lib/i18n";
import ProSuccessContent from "./pro-success-content";

const inactiveAccess = {
  isActive: false,
  plan: null,
  status: null,
  currentPeriodEnd: null,
  subscriptionId: null,
  expiresAt: null,
};

const activeAccess = {
  isActive: true,
  plan: "PRO" as const,
  status: "ACTIVE" as const,
  currentPeriodEnd: new Date("2027-01-01"),
  subscriptionId: "sub-1",
  expiresAt: new Date("2027-01-01"),
};

describe("ProSuccessContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows loader while verifying with session_id", () => {
    getProCheckoutSessionDetailsMock.mockImplementation(
      () => new Promise(() => undefined),
    );

    render(<ProSuccessContent sessionId="cs_test_1" initialProAccess={inactiveAccess} />);

    expect(screen.getByTestId("pro-success-page-card")).toBeTruthy();
    expect(
      screen.getByText(t("fr", "account.subscription.proSuccessLoading")),
    ).toBeTruthy();
  });

  it("shows invalid session message when session_id is missing", async () => {
    render(<ProSuccessContent sessionId={null} initialProAccess={inactiveAccess} />);

    await waitFor(() => {
      expect(
        screen.getByText(t("fr", "account.subscription.invalidSession")),
      ).toBeTruthy();
    });
    expect(getProCheckoutSessionDetailsMock).not.toHaveBeenCalled();
  });

  it("shows success card immediately when Pro is already active", async () => {
    render(<ProSuccessContent sessionId="cs_test_1" initialProAccess={activeAccess} />);

    await waitFor(() => {
      expect(
        screen.getByText(t("fr", "account.subscription.successTitle")),
      ).toBeTruthy();
    });
    expect(
      screen.getByRole("link", { name: t("fr", "account.subscription.viewQuizzes") }),
    ).toBeTruthy();
    expect(screen.getByTestId("manage-pro-subscription-button")).toBeTruthy();
    expect(getProCheckoutSessionDetailsMock).not.toHaveBeenCalled();
  });

  it("shows success after webhook activation poll", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    getProCheckoutSessionDetailsMock.mockResolvedValue({
      success: true,
      isValid: true,
      paymentStatus: "paid",
      subscriptionId: "sub_stripe",
      customerId: "cus_1",
    });

    let pollCount = 0;
    getProSubscriptionAccessActionMock.mockImplementation(async () => {
      pollCount += 1;
      if (pollCount >= 2) {
        return { success: true, access: activeAccess };
      }
      return { success: true, access: inactiveAccess };
    });

    render(<ProSuccessContent sessionId="cs_test_1" initialProAccess={inactiveAccess} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
    });

    expect(
      screen.getByText(t("fr", "account.subscription.successTitle")),
    ).toBeTruthy();
    expect(getProCheckoutSessionDetailsMock).toHaveBeenCalledWith("cs_test_1");

    vi.useRealTimers();
  }, 15000);
});
