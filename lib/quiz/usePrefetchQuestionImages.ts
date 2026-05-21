"use client";

import { useEffect, useRef } from "react";

import {
  getQuestionImagePrefetchUrls,
  type QuestionImagePrefetchInput,
} from "./getQuestionImagePrefetchUrls";

export type UsePrefetchQuestionImagesOptions = {
  /** How many upcoming questions (after current) to prefetch. Default: 2 */
  lookahead?: number;
};

const DEFAULT_LOOKAHEAD = 2;

/**
 * Prefetches images for upcoming questions in the play order (non-blocking).
 * Tracks URLs already prefetched in this session to avoid duplicate requests.
 */
export function usePrefetchQuestionImages(
  questions: QuestionImagePrefetchInput[],
  currentQuestionIndex: number,
  options?: UsePrefetchQuestionImagesOptions,
): void {
  const preloadedUrlsRef = useRef(new Set<string>());
  const lookahead = options?.lookahead ?? DEFAULT_LOOKAHEAD;

  useEffect(() => {
    const urls = getQuestionImagePrefetchUrls(questions, currentQuestionIndex, {
      lookahead,
    });

    const imagesThisRun: HTMLImageElement[] = [];

    for (const url of urls) {
      if (preloadedUrlsRef.current.has(url)) {
        continue;
      }
      preloadedUrlsRef.current.add(url);

      const img = new Image();
      imagesThisRun.push(img);
      img.src = url;
    }

    return () => {
      for (const img of imagesThisRun) {
        img.src = "";
      }
    };
  }, [questions, currentQuestionIndex, lookahead]);
}
