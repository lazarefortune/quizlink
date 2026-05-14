"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";

type FullscreenBlockingOverlayProps = {
  open: boolean;
  title: string;
  description?: string;
};

export function FullscreenBlockingOverlay({
  open,
  title,
  description,
}: FullscreenBlockingOverlayProps) {
  const reducedMotion = useReducedMotion();

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 p-6 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <motion.div
        initial={{ opacity: 0, y: reducedMotion ? 0 : 10, scale: reducedMotion ? 1 : 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.22 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-xl"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Loader2 className="h-7 w-7 animate-spin" aria-hidden />
        </div>
        <p className="mt-5 text-lg font-semibold text-foreground">{title}</p>
        {description ? (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </motion.div>
    </div>
  );
}
