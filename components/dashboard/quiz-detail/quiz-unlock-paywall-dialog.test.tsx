/* @vitest-environment jsdom */

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { PRO_MONTHLY_PRICE_EUR } from "@/lib/subscription/proSubscriptionConstants";

const unlockActionMock = vi.fn();
const createProCheckoutMock = vi.fn();
const showToastMock = vi.fn();
const refreshMock = vi.fn();
const locationAssignMock = vi.fn();

vi.mock("@/lib/i18n/use-locale", () => ({
  useLocale: () => ({ locale: "fr" as const }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, push: vi.fn() }),
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

vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({ showToast: showToastMock }),
}));

vi.mock("@/app/(app)/dashboard/quiz/[quizId]/unlock-actions", () => ({
  unlockQuizWithCoinsAction: (...args: unknown[]) => unlockActionMock(...args),
}));

vi.mock("@/app/(app)/account/pro-subscription/actions", () => ({
  createProSubscriptionCheckoutAction: (...args: unknown[]) =>
    createProCheckoutMock(...args),
}));

import { t } from "@/lib/i18n";

import {
  QuizUnlockPaywallDialog,
  useQuizUnlockPaywallDialog,
} from "./quiz-unlock-paywall-dialog";

function renderDialog(
  props: Partial<React.ComponentProps<typeof QuizUnlockPaywallDialog>> = {},
) {
  const onUnlockWithCoins = vi.fn();
  const onStartProCheckout = vi.fn();
  render(
    <QuizUnlockPaywallDialog
      open
      onOpenChange={() => undefined}
      quizId="quiz-1"
      coinBalance={props.coinBalance ?? 50}
      unlockCost={40}
      isUnlocking={false}
      onUnlockWithCoins={onUnlockWithCoins}
      buyCoinsHref="/account/coins?returnTo=%2Fdashboard%2Fquiz%2Fquiz-1"
      isProAvailable={false}
      onStartProCheckout={onStartProCheckout}
      {...props}
    />,
  );
  return { onUnlockWithCoins, onStartProCheckout };
}

describe("QuizUnlockPaywallDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign: locationAssignMock },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows quota unlock layout with coin and subscription prices", () => {
    renderDialog({ isProAvailable: true });

    const dialog = screen.getByTestId("quiz-unlock-paywall-dialog");
    expect(dialog).toBeTruthy();
    expect(
      within(dialog).getByRole("heading", {
        level: 2,
        name: t("fr", "dashboard.unlockDialog.title"),
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(t("fr", "dashboard.unlockDialog.coinOptionDescription")),
    ).toBeTruthy();
    expect(
      screen.getByText(t("fr", "dashboard.unlockDialog.proOptionDescription")),
    ).toBeTruthy();
    expect(screen.getByText("40 coins")).toBeTruthy();
    expect(screen.getByText(`${PRO_MONTHLY_PRICE_EUR}€`)).toBeTruthy();
    expect(screen.getByText(t("fr", "account.subscription.perMonth"))).toBeTruthy();
    expect(screen.queryByText(/prolonger/i)).toBeNull();
    expect(screen.queryByText(/réactiver/i)).toBeNull();
    expect(screen.queryByText(/2 mois/i)).toBeNull();
  });

  it("shows disabled Pro soon button when isProAvailable is false", () => {
    renderDialog({ isProAvailable: false });

    const proButton = screen.getByTestId("quiz-unlock-pro-checkout");
    expect(proButton).toHaveProperty("disabled", true);
    expect(proButton.textContent).toContain(t("fr", "dashboard.unlockDialog.proSoon"));
    expect(screen.getByText(t("fr", "dashboard.soonBadge"))).toBeTruthy();
  });

  it("shows active Passer à Pro button when isProAvailable is true", () => {
    renderDialog({ isProAvailable: true });

    const proButton = screen.getByTestId("quiz-unlock-pro-checkout");
    expect(proButton).toHaveProperty("disabled", false);
    expect(proButton.textContent).toContain(t("fr", "dashboard.unlockDialog.unlockAllWithPro"));
    expect(screen.queryByText(t("fr", "dashboard.soonBadge"))).toBeNull();
  });

  it("calls onStartProCheckout when Passer à Pro is clicked", () => {
    const { onStartProCheckout } = renderDialog({ isProAvailable: true });

    fireEvent.click(screen.getByTestId("quiz-unlock-pro-checkout"));
    expect(onStartProCheckout).toHaveBeenCalled();
  });

  it("shows active unlock button when balance is sufficient", () => {
    const { onUnlockWithCoins } = renderDialog({ coinBalance: 50, isProAvailable: true });

    const unlockButton = screen.getByRole("button", {
      name: t("fr", "dashboard.quizQuota.unlockQuiz"),
    });
    expect(unlockButton).not.toHaveProperty("disabled", true);
    fireEvent.click(unlockButton);
    expect(onUnlockWithCoins).toHaveBeenCalled();
  });

  it("shows missing coins message and buy link when balance is insufficient", () => {
    renderDialog({ coinBalance: 10, isProAvailable: true });

    expect(
      screen.getByText(t("fr", "dashboard.unlockPaywall.missingCoins", { coins: "30" })),
    ).toBeTruthy();
    const buyLink = screen.getByRole("link", { name: t("fr", "dashboard.unlockDialog.buyCoins") });
    expect(buyLink.getAttribute("href")).toContain("/account/coins");
  });
});

describe("useQuizUnlockPaywallDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign: locationAssignMock },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls unlock action and refreshes on success", async () => {
    unlockActionMock.mockResolvedValue({
      success: true,
      alreadyUnlocked: false,
      newBalance: 10,
    });

    function Harness() {
      const paywall = useQuizUnlockPaywallDialog({
        quizId: "quiz-1",
        coinBalance: 50,
        unlockCost: 40,
        isProAvailable: false,
      });

      return (
        <>
          <button type="button" onClick={() => void paywall.handleUnlockWithCoins()}>
            trigger-unlock
          </button>
          <span data-testid="buy-href">{paywall.buyCoinsHref}</span>
        </>
      );
    }

    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "trigger-unlock" }));

    await waitFor(() => {
      expect(unlockActionMock).toHaveBeenCalledWith("quiz-1");
    });
    expect(showToastMock).toHaveBeenCalledWith(t("fr", "dashboard.unlockPaywall.success"), "success");
    expect(refreshMock).toHaveBeenCalled();
    expect(screen.getByTestId("buy-href").textContent).toContain("returnTo=");
  });

  it("redirects to Stripe Checkout when Pro checkout succeeds", async () => {
    createProCheckoutMock.mockResolvedValue({
      success: true,
      checkoutUrl: "https://checkout.stripe.com/pro-session",
    });

    function Harness() {
      const paywall = useQuizUnlockPaywallDialog({
        quizId: "quiz-1",
        coinBalance: 50,
        unlockCost: 40,
        isProAvailable: true,
      });

      return (
        <button type="button" onClick={() => void paywall.handleStartProCheckout()}>
          trigger-pro
        </button>
      );
    }

    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "trigger-pro" }));

    await waitFor(() => {
      expect(createProCheckoutMock).toHaveBeenCalled();
    });
    expect(locationAssignMock).toHaveBeenCalledWith("https://checkout.stripe.com/pro-session");
    expect(showToastMock).not.toHaveBeenCalled();
  });

  it("shows checkout error toast when Pro checkout fails", async () => {
    createProCheckoutMock.mockResolvedValue({
      success: false,
      error: "Pro is not configured",
    });

    function Harness() {
      const paywall = useQuizUnlockPaywallDialog({
        quizId: "quiz-1",
        coinBalance: 50,
        unlockCost: 40,
        isProAvailable: true,
      });

      return (
        <button type="button" onClick={() => void paywall.handleStartProCheckout()}>
          trigger-pro
        </button>
      );
    }

    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "trigger-pro" }));

    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalledWith(
        t("fr", "account.subscription.checkoutError"),
        "error",
      );
    });
    expect(locationAssignMock).not.toHaveBeenCalled();
  });

  it("does not start Pro checkout when isProAvailable is false", async () => {
    function Harness() {
      const paywall = useQuizUnlockPaywallDialog({
        quizId: "quiz-1",
        coinBalance: 50,
        unlockCost: 40,
        isProAvailable: false,
      });

      return (
        <button type="button" onClick={() => void paywall.handleStartProCheckout()}>
          trigger-pro
        </button>
      );
    }

    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "trigger-pro" }));

    await waitFor(() => {
      expect(createProCheckoutMock).not.toHaveBeenCalled();
    });
  });
});
