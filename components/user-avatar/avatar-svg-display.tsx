"use client";

import { useMemo } from "react";

import { normalizeAvatarSvg } from "@/lib/user-avatar/normalizeAvatarSvg";
import { cn } from "@/lib/utils";

type AvatarSvgDisplayProps = {
  svg: string;
  className?: string;
};

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(normalizeAvatarSvg(svg))}`;
}

/**
 * Renders a DiceBear SVG so it fills its container.
 * Using <img> + object-contain is more reliable than inline SVG on mobile Safari.
 */
export function AvatarSvgDisplay({ svg, className }: AvatarSvgDisplayProps) {
  const src = useMemo(() => svgToDataUri(svg), [svg]);

  return (
    <img
      src={src}
      alt=""
      aria-hidden
      draggable={false}
      className={cn("block h-full w-full object-contain", className)}
    />
  );
}
