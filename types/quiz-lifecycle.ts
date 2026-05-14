/**
 * Mirrors `QuizStatus` in Prisma. Kept as a string union for UI and pure helpers
 * without coupling client bundles to generated Prisma enum types.
 */
export type QuizLifecycleStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
