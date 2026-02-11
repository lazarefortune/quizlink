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
    },
  });

  if (!user) {
    redirect("/auth/signin");
  }

  // Ensure preferredLanguage is a valid value
  const userWithTypedLanguage = {
    ...user,
    preferredLanguage: (user.preferredLanguage === "en" ? "en" : "fr") as "fr" | "en",
  };

  return <AccountContent user={userWithTypedLanguage} />;
}
