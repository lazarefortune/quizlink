// Builder layout - protection is handled at the page level
// /builder/preview has its own page that allows unauthenticated access
// All other routes (/builder and /builder/[quizId]) are protected in their page components
export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
