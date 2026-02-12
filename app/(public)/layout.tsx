/**
 * Layout for public routes: landing, auth, pricing, legal.
 * No sidebar; root layout provides Header + Footer.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
