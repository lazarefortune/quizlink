"use client";

import { Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BuilderPageContent } from "../page-content";
import { AuthRequiredOverlay } from "@/components/auth-required-overlay";

export default function BuilderQuizPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const quizId = params?.quizId as string | undefined;

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!quizId) {
    router.replace("/dashboard/create");
    return null;
  }

  if (!session?.user) {
    return (
      <div className="relative min-h-screen">
        <div className="blur-sm pointer-events-none">
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center">
                <p>Loading...</p>
              </div>
            }
          >
            <BuilderPageContent initialQuizId={quizId} />
          </Suspense>
        </div>
        <AuthRequiredOverlay returnUrl={`/builder/${quizId}`} />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p>Loading...</p>
        </div>
      }
    >
      <BuilderPageContent initialQuizId={quizId} />
    </Suspense>
  );
}
