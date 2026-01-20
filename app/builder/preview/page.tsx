"use client";

import { Suspense } from "react";
import { BuilderPageContent } from "../page-content";
import { AuthRequiredOverlay } from "@/components/auth-required-overlay";
import { useSession } from "next-auth/react";

export default function BuilderPreviewPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className={session?.user ? "" : "blur-sm pointer-events-none select-none"}>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <p>Loading...</p>
            </div>
          }
        >
          <BuilderPageContent />
        </Suspense>
      </div>
      {!session?.user && <AuthRequiredOverlay />}
    </div>
  );
}
