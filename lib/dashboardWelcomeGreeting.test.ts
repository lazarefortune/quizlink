import { describe, expect, it } from "vitest";

import { resolveDashboardWelcomeGreetingKey } from "./dashboardWelcomeGreeting";

describe("resolveDashboardWelcomeGreetingKey", () => {
  it("returns morning between 05:00 and 11:59 (local)", () => {
    expect(resolveDashboardWelcomeGreetingKey(new Date(2026, 4, 9, 5, 0, 0))).toBe(
      "dashboard.welcome.titleGreetingMorning"
    );
    expect(resolveDashboardWelcomeGreetingKey(new Date(2026, 4, 9, 11, 59, 0))).toBe(
      "dashboard.welcome.titleGreetingMorning"
    );
  });

  it("returns afternoon between 12:00 and 17:59 (local)", () => {
    expect(resolveDashboardWelcomeGreetingKey(new Date(2026, 4, 9, 12, 0, 0))).toBe(
      "dashboard.welcome.titleGreetingAfternoon"
    );
    expect(resolveDashboardWelcomeGreetingKey(new Date(2026, 4, 9, 17, 59, 0))).toBe(
      "dashboard.welcome.titleGreetingAfternoon"
    );
  });

  it("returns evening between 18:00 and 21:59 (local)", () => {
    expect(resolveDashboardWelcomeGreetingKey(new Date(2026, 4, 9, 18, 0, 0))).toBe(
      "dashboard.welcome.titleGreetingEvening"
    );
    expect(resolveDashboardWelcomeGreetingKey(new Date(2026, 4, 9, 21, 59, 0))).toBe(
      "dashboard.welcome.titleGreetingEvening"
    );
  });

  it("returns night between 22:00 and 04:59 (local)", () => {
    expect(resolveDashboardWelcomeGreetingKey(new Date(2026, 4, 9, 22, 0, 0))).toBe(
      "dashboard.welcome.titleGreetingNight"
    );
    expect(resolveDashboardWelcomeGreetingKey(new Date(2026, 4, 9, 4, 59, 0))).toBe(
      "dashboard.welcome.titleGreetingNight"
    );
  });
});
