"use client";

import { GeneratePage } from "./page";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function GeneratePageWrapper() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session?.user) {
    redirect("/generate/preview");
  }

  return <GeneratePage />;
}
