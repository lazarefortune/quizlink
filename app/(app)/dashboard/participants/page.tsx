import { Suspense } from "react";
import { ParticipantsContent } from "./participants-content";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ParticipantsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-50 dark:bg-background flex items-center justify-center">Chargement...</div>}>
      <ParticipantsContent />
    </Suspense>
  );
}
