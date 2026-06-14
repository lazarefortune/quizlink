import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { prisma } from "@/lib/prisma";
import { ensureDefaultUserAvatar } from "@/lib/user-avatar/ensureDefaultUserAvatar";
import { resolveUserAvatarDisplay } from "@/lib/user-avatar/resolveUserAvatarDisplay";

/**
 * Admin layout: mêmes principes de design que le DashboardShell
 * (sidebar fixe à gauche, topbar mobile, main scrollable),
 * mais avec la navigation/admin-specific et accès réservé aux ADMIN.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  let userAvatar: string | null = null;
  let userAvatarBackgroundColor: string | undefined;

  if (prisma) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatar: true, avatarConfig: true },
    });

    let avatarConfig = user?.avatarConfig ?? null;

    if (!user?.avatar) {
      const ensured = await ensureDefaultUserAvatar(session.user.id);
      userAvatar = ensured?.avatar ?? null;
      avatarConfig = ensured?.avatarConfig ?? avatarConfig;
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
    <AdminShell
      userAvatar={userAvatar}
      userAvatarBackgroundColor={userAvatarBackgroundColor}
    >
      {children}
    </AdminShell>
  );
}
