"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GeneratePage } from "../page-content";
import { useSession } from "next-auth/react";

export default function GeneratePreviewPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/auth/signin?callbackUrl=${encodeURIComponent("/generate/preview")}`);
    }
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return <GeneratePage />;
}
