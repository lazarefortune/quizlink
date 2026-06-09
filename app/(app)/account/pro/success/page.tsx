import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getActiveUserSubscriptionAccess } from "@/lib/quiz/getActiveUserSubscriptionAccess";

import ProSuccessContent from "./pro-success-content";

type ProSuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function ProSuccessPage({ searchParams }: ProSuccessPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const { session_id: sessionId } = await searchParams;
  const initialProAccess = await getActiveUserSubscriptionAccess(session.user.id);

  return (
    <ProSuccessContent sessionId={sessionId ?? null} initialProAccess={initialProAccess} />
  );
}
