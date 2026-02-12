"use client";

import { Suspense } from "react";
import { BuilderPageContent } from "./page-content";

/**
 * Builder (create manually) page. Auth is enforced by (app)/layout.
 */
export default function BuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      }
    >
      <BuilderPageContent />
    </Suspense>
  );
}
