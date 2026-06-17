/* @vitest-environment jsdom */

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const portalActionMock = vi.fn();
const showToastMock = vi.fn();
const locationAssignMock = vi.fn();

vi.mock("@/app/(app)/account/pro-subscription/actions", () => ({
  createStripeBillingPortalSessionAction: (...args: unknown[]) =>
    portalActionMock(...args),
}));

vi.mock("@/lib/i18n/use-locale", () => ({
  useLocale: () => ({ locale: "fr" as const }),
}));

vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({ showToast: showToastMock }),
}));

import { t } from "@/lib/i18n";
import { useManageProSubscription } from "./use-manage-pro-subscription";

describe("useManageProSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign: locationAssignMock },
    });
  });

  it("redirects to Stripe portal on success", async () => {
    portalActionMock.mockResolvedValue({
      success: true,
      portalUrl: "https://billing.stripe.com/session/test",
    });

    const { result } = renderHook(() => useManageProSubscription());

    await act(async () => {
      await result.current.openBillingPortal();
    });

    expect(portalActionMock).toHaveBeenCalled();
    expect(locationAssignMock).toHaveBeenCalledWith(
      "https://billing.stripe.com/session/test",
    );
  });

  it("shows error toast when portal action fails", async () => {
    portalActionMock.mockResolvedValue({
      success: false,
      error: "No Stripe customer",
    });

    const { result } = renderHook(() => useManageProSubscription());

    await act(async () => {
      await result.current.openBillingPortal();
    });

    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalledWith(
        t("fr", "account.subscription.portalError"),
        "error",
      );
    });
    expect(locationAssignMock).not.toHaveBeenCalled();
  });
});
