"use client";

import { Suspense } from "react";
import { BuilderBareRouteGate } from "./builder-bare-route-gate";
import { BuilderPageContent } from "./page-content";

/**
 * Builder (create manually) page. Auth is enforced by (app)/layout.
 * Bare `/builder` redirects to `/dashboard/create` unless a local draft / session transfer applies.
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
      <BuilderBareRouteGate>
        <BuilderPageContent />
      </BuilderBareRouteGate>
    </Suspense>
  );
}
