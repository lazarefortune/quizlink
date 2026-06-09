import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CoinsContent } from "./coins-content";
import { getActiveUserSubscriptionAccess } from "@/lib/quiz/getActiveUserSubscriptionAccess";

export default async function CoinsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const isProAvailable = Boolean(process.env.STRIPE_PRO_PRICE_ID);
  const proAccess = await getActiveUserSubscriptionAccess(session.user.id);

  return <CoinsContent proAccess={proAccess} isProAvailable={isProAvailable} />;
}
