"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BuilderPageContent } from "../page-content";
import { useSession } from "next-auth/react";

export default function BuilderPreviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/auth/signin?callbackUrl=${encodeURIComponent("/builder/preview")}`);
    }
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
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
      <BuilderPageContent />
    </Suspense>
  );
}
