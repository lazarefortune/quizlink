export type QuestionImageSrcInput = {
  image?: string | null;
  imageKey?: string | null;
};

/**
 * Resolved URL for displaying a question image: stored asset first, then legacy inline/remote.
 */
export function getQuestionImageSrc(question: QuestionImageSrcInput): string | null {
  const key = question.imageKey?.trim();
  if (key && key.length > 0) {
    const encoded = key.split("/").map((segment) => encodeURIComponent(segment));
    return `/api/question-images/${encoded.join("/")}`;
  }
  const legacy = question.image?.trim() ?? "";
  if (legacy.length === 0) {
    return null;
  }
  return legacy;
}

export function hasQuestionImage(question: QuestionImageSrcInput): boolean {
  return getQuestionImageSrc(question) !== null;
}
