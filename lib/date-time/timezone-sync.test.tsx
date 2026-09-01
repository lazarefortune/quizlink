/* @vitest-environment jsdom */

import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refreshMock = vi.fn();
const syncTimeZoneActionMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("./actions", () => ({
  syncTimeZoneAction: (...args: unknown[]) => syncTimeZoneActionMock(...args),
}));

import { TimeZoneProvider } from "./timezone-provider";
import { TimeZoneSync } from "./timezone-sync";

describe("TimeZoneSync", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    syncTimeZoneActionMock.mockReset();
    syncTimeZoneActionMock.mockResolvedValue({ success: true });
  });

  it("does not sync when initial timezone already matches the browser", async () => {
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    render(
      <TimeZoneProvider initialTimeZone={browserTimeZone}>
        <TimeZoneSync initialTimeZone={browserTimeZone} />
      </TimeZoneProvider>,
    );

    await waitFor(() => {
      expect(syncTimeZoneActionMock).not.toHaveBeenCalled();
      expect(refreshMock).not.toHaveBeenCalled();
    });
  });

  it("syncs once when browser timezone differs from server initial timezone", async () => {
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const differentTimeZone =
      browserTimeZone === "Europe/Paris" ? "America/New_York" : "Europe/Paris";

    render(
      <TimeZoneProvider initialTimeZone={differentTimeZone}>
        <TimeZoneSync initialTimeZone={differentTimeZone} />
      </TimeZoneProvider>,
    );

    await waitFor(() => {
      expect(syncTimeZoneActionMock).toHaveBeenCalledTimes(1);
      expect(syncTimeZoneActionMock).toHaveBeenCalledWith(browserTimeZone);
      expect(refreshMock).toHaveBeenCalledTimes(1);
    });
  });
});
