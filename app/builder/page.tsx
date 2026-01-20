"use client";

import { Suspense } from "react";
import { BuilderPageContent } from "./page-content";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function BuilderPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session?.user) {
    redirect("/builder/preview");
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
