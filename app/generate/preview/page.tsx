"use client";

import { GeneratePage } from "../page-content";
import { AuthRequiredOverlay } from "@/components/auth-required-overlay";
import { useSession } from "next-auth/react";

export default function GeneratePreviewPage() {
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
        <GeneratePage />
      </div>
      {!session?.user && <AuthRequiredOverlay />}
    </div>
  );
}
