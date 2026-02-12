// This layout allows unauthenticated access to /builder/preview
// All other builder routes are protected by the parent layout
export default function BuilderPreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
