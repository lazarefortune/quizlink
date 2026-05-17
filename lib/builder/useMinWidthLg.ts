"use client";

import { useSyncExternalStore } from "react";

const MEDIA_QUERY = "(min-width: 1024px)";

function subscribe(onStoreChange: () => void): () => void {
  const mq = window.matchMedia(MEDIA_QUERY);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(MEDIA_QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/** Matches Tailwind `lg` breakpoint (1024px). Server snapshot is `false` (mobile-first). */
export function useMinWidthLg(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
