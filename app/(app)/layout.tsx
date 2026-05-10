import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { prisma } from "@/lib/prisma";

/**
 * Authenticated app layout: one dashboard shell (sidebar + topbar + main) for all user pages.
 * Redirects to signin if not authenticated.
 * Missing CGU / privacy acceptance is enforced by a blocking modal (see DashboardShell).
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  let needsLegalConsent = false;

  if (prisma) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        termsAcceptedAt: true,
        privacyAcceptedAt: true,
      },
    });

    if (!user) {
      redirect("/auth/signin");
    }

    needsLegalConsent =
      user.termsAcceptedAt == null || user.privacyAcceptedAt == null;
  }

  return (
    <DashboardShell needsLegalConsent={needsLegalConsent}>
      {children}
    </DashboardShell>
  );
}
