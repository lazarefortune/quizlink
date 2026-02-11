/**
 * Participant public portal layout: no sidebar, minimal chrome.
 * Root layout still provides Header/Footer; header hides on /p/*.
 */
export default function ParticipantPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
