export const USER_QUIZ_DEFAULT_VISIBILITY = "PRIVATE" as const;

export function getUserQuizCreationVisibility(): "PRIVATE" {
  return USER_QUIZ_DEFAULT_VISIBILITY;
}
