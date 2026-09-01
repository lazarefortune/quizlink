import { describe, expect, it } from "vitest";

import { resolveDashboardWelcomeGreetingKey } from "./dashboardWelcomeGreeting";

const PARIS = "Europe/Paris";

describe("resolveDashboardWelcomeGreetingKey", () => {
  it("returns morning between 05:00 and 11:59 in the user timezone", () => {
    expect(
      resolveDashboardWelcomeGreetingKey(
        new Date("2026-05-09T03:00:00.000Z"),
        PARIS,
      ),
    ).toBe("dashboard.welcome.titleGreetingMorning");
    expect(
      resolveDashboardWelcomeGreetingKey(
        new Date("2026-05-09T09:59:00.000Z"),
        PARIS,
      ),
    ).toBe("dashboard.welcome.titleGreetingMorning");
  });

  it("returns afternoon between 12:00 and 17:59 in the user timezone", () => {
    expect(
      resolveDashboardWelcomeGreetingKey(
        new Date("2026-05-09T10:00:00.000Z"),
        PARIS,
      ),
    ).toBe("dashboard.welcome.titleGreetingAfternoon");
    expect(
      resolveDashboardWelcomeGreetingKey(
        new Date("2026-05-09T15:59:00.000Z"),
        PARIS,
      ),
    ).toBe("dashboard.welcome.titleGreetingAfternoon");
  });

  it("returns evening between 18:00 and 21:59 in the user timezone", () => {
    expect(
      resolveDashboardWelcomeGreetingKey(
        new Date("2026-05-09T16:00:00.000Z"),
        PARIS,
      ),
    ).toBe("dashboard.welcome.titleGreetingEvening");
    expect(
      resolveDashboardWelcomeGreetingKey(
        new Date("2026-05-09T19:59:00.000Z"),
        PARIS,
      ),
    ).toBe("dashboard.welcome.titleGreetingEvening");
  });

  it("returns night between 22:00 and 04:59 in the user timezone", () => {
    expect(
      resolveDashboardWelcomeGreetingKey(
        new Date("2026-05-09T20:00:00.000Z"),
        PARIS,
      ),
    ).toBe("dashboard.welcome.titleGreetingNight");
    expect(
      resolveDashboardWelcomeGreetingKey(
        new Date("2026-05-09T02:59:00.000Z"),
        PARIS,
      ),
    ).toBe("dashboard.welcome.titleGreetingNight");
  });
});
