"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";

type QuizQuestionImageLoadState = "loading" | "loaded" | "error";

export type QuizQuestionImageProps = {
  src: string | null;
  alt?: string;
  className?: string;
};

export function QuizQuestionImage({
  src,
  alt = "Question",
  className,
}: QuizQuestionImageProps) {
  const [loadState, setLoadState] = useState<QuizQuestionImageLoadState>("loading");

  useEffect(() => {
    if (!src) {
      return;
    }
    setLoadState("loading");
  }, [src]);

  if (!src) {
    return null;
  }

  const isLoaded = loadState === "loaded";
  const hasError = loadState === "error";

  return (
    <div
      className={cn(
        "relative mb-4 h-48 w-full sm:h-64",
        className,
      )}
      aria-busy={!isLoaded && !hasError}
    >
      {!isLoaded && !hasError ? (
        <div
          className="absolute inset-0 animate-pulse rounded-md border bg-muted"
          aria-hidden
        />
      ) : null}

      {hasError ? (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-md border bg-muted/60"
          role="img"
          aria-label={alt}
        >
          <ImageOff className="h-8 w-8 text-muted-foreground" aria-hidden />
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          className={cn(
            "rounded-md border object-contain transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
          )}
          unoptimized
          onLoad={() => setLoadState("loaded")}
          onError={() => setLoadState("error")}
        />
      )}
    </div>
  );
}
