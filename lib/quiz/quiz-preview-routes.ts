export const QUIZ_PREVIEW_PATH_PREFIX = "/preview/quiz/";

export function buildQuizPreviewPath(quizId: string): string {
  const trimmed = quizId.trim();
  return `${QUIZ_PREVIEW_PATH_PREFIX}${trimmed}`;
}

export function buildLegacyDashboardQuizPreviewPath(quizId: string): string {
  const trimmed = quizId.trim();
  return `/dashboard/quiz/${trimmed}/preview`;
}

type SearchParamsInput = Record<string, string | string[] | undefined>;

export function appendSearchParamsToPath(
  path: string,
  searchParams?: SearchParamsInput,
): string {
  if (!searchParams) {
    return path;
  }

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        query.append(key, item);
      }
      continue;
    }
    query.set(key, value);
  }

  const serialized = query.toString();
  return serialized ? `${path}?${serialized}` : path;
}

export function resolveLegacyDashboardPreviewRedirect(
  quizId: string,
  searchParams?: SearchParamsInput,
): string {
  return appendSearchParamsToPath(buildQuizPreviewPath(quizId), searchParams);
}

export function buildQuizPreviewAbsoluteUrl(
  quizId: string,
  origin = typeof window !== "undefined" ? window.location.origin : "",
): string {
  return `${origin}${buildQuizPreviewPath(quizId)}`;
}

