import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { prisma } from "@/lib/prisma";
import { ensureDefaultUserAvatar } from "@/lib/user-avatar/ensureDefaultUserAvatar";
import { resolveUserAvatarDisplay } from "@/lib/user-avatar/resolveUserAvatarDisplay";

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
  let userAvatar: string | null = null;
  let userAvatarBackgroundColor: string | undefined;

  if (prisma) {
    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        termsAcceptedAt: true,
        privacyAcceptedAt: true,
        avatar: true,
        avatarConfig: true,
      },
    });

    if (!user) {
      redirect("/auth/signin");
    }

    needsLegalConsent =
      user.termsAcceptedAt == null || user.privacyAcceptedAt == null;

    let avatarConfig = user.avatarConfig;

    if (!user.avatar) {
      const ensured = await ensureDefaultUserAvatar(session.user.id);
      userAvatar = ensured?.avatar ?? null;
      avatarConfig = ensured?.avatarConfig ?? avatarConfig;

      if (!userAvatar) {
        user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            termsAcceptedAt: true,
            privacyAcceptedAt: true,
            avatar: true,
            avatarConfig: true,
          },
        });
        userAvatar = user?.avatar ?? null;
        avatarConfig = user?.avatarConfig ?? avatarConfig;
      }
    } else {
      userAvatar = user.avatar;
    }

    const display = resolveUserAvatarDisplay({
      avatar: userAvatar,
      avatarConfig,
    });
    userAvatar = display.avatar;
    userAvatarBackgroundColor = display.backgroundColor;
  }

  return (
    <DashboardShell
      needsLegalConsent={needsLegalConsent}
      userAvatar={userAvatar}
      userAvatarBackgroundColor={userAvatarBackgroundColor}
    >
      {children}
    </DashboardShell>
  );
}
