import {
  getQuestionImageSrc,
  type QuestionImageSrcInput,
} from "@/lib/question-image-src";

export type QuestionImagePrefetchInput = QuestionImageSrcInput;

export type GetQuestionImagePrefetchUrlsOptions = {
  /** How many upcoming questions (after current) to prefetch. Default: 2 */
  lookahead?: number;
};

const DEFAULT_LOOKAHEAD = 2;

/**
 * URLs of question images to prefetch ahead of the current index.
 * Skips the current question, questions without images, and duplicate URLs.
 */
export function getQuestionImagePrefetchUrls(
  questions: QuestionImagePrefetchInput[],
  currentQuestionIndex: number,
  options?: GetQuestionImagePrefetchUrlsOptions,
): string[] {
  const lookahead = options?.lookahead ?? DEFAULT_LOOKAHEAD;
  if (lookahead <= 0 || questions.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const urls: string[] = [];

  for (let offset = 1; offset <= lookahead; offset += 1) {
    const index = currentQuestionIndex + offset;
    if (index >= questions.length) {
      break;
    }

    const src = getQuestionImageSrc(questions[index]);
    if (!src || seen.has(src)) {
      continue;
    }

    seen.add(src);
    urls.push(src);
  }

  return urls;
}
