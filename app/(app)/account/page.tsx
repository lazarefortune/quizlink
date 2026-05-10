import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
    },
  });

  if (!user) {
    redirect("/auth/signin");
  }

  const userWithTypedLanguage = {
    ...user,
    preferredLanguage: (user.preferredLanguage === "en" ? "en" : "fr") as "fr" | "en",
    hasGoogleAccount: !!user.googleId,
    hasPassword: !!user.passwordHash,
  };

  return <AccountContent user={userWithTypedLanguage} />;
}
