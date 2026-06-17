import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveUserSubscriptionAccess } from "@/lib/quiz/getActiveUserSubscriptionAccess";
import { resolveUserAvatarDisplay } from "@/lib/user-avatar/resolveUserAvatarDisplay";
import { AccountContent } from "./account-content";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Get user data
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      preferredLanguage: true,
      emailVerifiedAt: true,
      createdAt: true,
      googleId: true,
      passwordHash: true,
      notifyQuizResponses: true,
      notifyProductUpdates: true,
      notifyMarketing: true,
      avatar: true,
      avatarConfig: true,
    },
  });

  if (!user) {
    redirect("/auth/signin");
  }

  const avatarDisplay = resolveUserAvatarDisplay({
    avatar: user.avatar,
    avatarConfig: user.avatarConfig,
  });

  const userWithTypedLanguage = {
    ...user,
    avatar: avatarDisplay.avatar,
    avatarBackgroundColor: avatarDisplay.backgroundColor,
    preferredLanguage: (user.preferredLanguage === "en" ? "en" : "fr") as "fr" | "en",
    hasGoogleAccount: !!user.googleId,
    hasPassword: !!user.passwordHash,
  };

  const proAccess = await getActiveUserSubscriptionAccess(session.user.id);

  return (
    <AccountContent
      user={userWithTypedLanguage}
      proAccess={proAccess}
      isProAvailable={Boolean(process.env.STRIPE_PRO_PRICE_ID)}
    />
  );
}
