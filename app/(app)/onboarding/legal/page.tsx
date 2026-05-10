import { redirect } from "next/navigation";

/** Legacy URL: consent is handled in-app; send users to the dashboard. */
export default function OnboardingLegalFallbackPage() {
  redirect("/dashboard");
}
