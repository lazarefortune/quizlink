export type DashboardWelcomeGreetingKey =
  | "dashboard.welcome.titleGreetingMorning"
  | "dashboard.welcome.titleGreetingAfternoon"
  | "dashboard.welcome.titleGreetingEvening"
  | "dashboard.welcome.titleGreetingNight";

/**
 * Local time buckets: morning 05–12, afternoon 12–18, evening 18–22, night 22–05.
 */
export function resolveDashboardWelcomeGreetingKey(
  date: Date = new Date()
): DashboardWelcomeGreetingKey {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "dashboard.welcome.titleGreetingMorning";
  if (hour >= 12 && hour < 18) return "dashboard.welcome.titleGreetingAfternoon";
  if (hour >= 18 && hour < 22) return "dashboard.welcome.titleGreetingEvening";
  return "dashboard.welcome.titleGreetingNight";
}
