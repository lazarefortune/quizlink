import { z } from "zod";

import {
  ALL_FEEDBACK_TYPES,
  FEEDBACK_CATEGORIES,
} from "@/lib/feedback/feedback-types";

export const feedbackTypeSchema = z.enum(ALL_FEEDBACK_TYPES);

export const feedbackStatusSchema = z.enum(["NEW", "IN_PROGRESS", "DONE"]);

export const feedbackCategorySchema = z.enum(FEEDBACK_CATEGORIES);

const FORBIDDEN_METADATA_KEY_FRAGMENTS = [
  "token",
  "session",
  "password",
  "secret",
  "authorization",
  "cookie",
] as const;

const MAX_METADATA_JSON_LENGTH = 2000;

export const feedbackMetadataSchema = z
  .record(z.string(), z.union([z.string().max(500), z.number(), z.boolean()]))
  .refine(
    (value) => JSON.stringify(value).length <= MAX_METADATA_JSON_LENGTH,
    { message: "Metadata trop volumineuse" },
  )
  .refine(
    (value) =>
      !Object.keys(value).some((key) =>
        FORBIDDEN_METADATA_KEY_FRAGMENTS.some((fragment) =>
          key.toLowerCase().includes(fragment),
        ),
      ),
    { message: "Metadata invalide" },
  );

const pageSchema = z
  .string()
  .max(500)
  .transform((value) => value.trim())
  .pipe(
    z
      .string()
      .min(1, "Chemin de page invalide")
      .refine((pathValue) => pathValue.startsWith("/"), {
        message: "Chemin de page invalide",
      })
      .refine((pathValue) => !/[\x00-\x1f]/.test(pathValue), {
        message: "Chemin de page invalide",
      }),
  );

const userAgentSchema = z
  .string()
  .max(500)
  .refine((ua) => !/[\r\n]/.test(ua), {
    message: "User-Agent invalide",
  });

const ratingSchema = z.number().int().min(1).max(5);

function trimToUndefined(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

const optionalMessageSchema = z
  .string()
  .optional()
  .transform(trimToUndefined)
  .pipe(
    z
      .string()
      .max(1500, "Le message ne peut pas dépasser 1500 caractères")
      .optional(),
  );

const optionalFeatureRequestSchema = z
  .string()
  .optional()
  .transform(trimToUndefined)
  .pipe(
    z
      .string()
      .max(1500, "La demande ne peut pas dépasser 1500 caractères")
      .optional(),
  );

const quizIdSchema = z.string().max(191).optional();

export const submitFeedbackSchema = z
  .object({
    type: feedbackTypeSchema,
    rating: ratingSchema.optional(),
    message: optionalMessageSchema,
    featureRequest: optionalFeatureRequestSchema,
    category: feedbackCategorySchema.optional(),
    page: pageSchema,
    userAgent: userAgentSchema,
    quizId: quizIdSchema,
    metadata: feedbackMetadataSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const hasMessage =
      data.message !== undefined && data.message.length >= 5;
    const hasFeatureRequest =
      data.featureRequest !== undefined && data.featureRequest.length >= 5;
    const hasMetadata =
      data.metadata !== undefined && Object.keys(data.metadata).length > 0;

    switch (data.type) {
      case "APP_REVIEW":
        if (data.rating === undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "La note est obligatoire",
            path: ["rating"],
          });
        }
        break;

      case "FEATURE_REQUEST":
        if (!hasFeatureRequest) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "La fonctionnalité souhaitée est obligatoire",
            path: ["featureRequest"],
          });
        }
        break;

      case "SUPPORT_MESSAGE":
      case "BUG":
        if (!hasMessage) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Le message est obligatoire",
            path: ["message"],
          });
        }
        break;

      case "SAVE_ERROR_REPORT":
        if (!hasMessage && !hasMetadata) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Un message ou des métadonnées sont requis",
            path: ["message"],
          });
        }
        break;

      case "SUGGESTION":
      case "FEEDBACK":
        if (!hasMessage) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Le message est obligatoire",
            path: ["message"],
          });
        }
        break;

      case "QUIZ_CREATION_REVIEW":
        if (data.rating === undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "La note est obligatoire",
            path: ["rating"],
          });
        }
        break;

      default: {
        const _exhaustive: never = data.type;
        void _exhaustive;
      }
    }
  });

export const submitUserFeedbackSchema = z.object({
  rating: ratingSchema,
  message: optionalMessageSchema,
  featureRequest: optionalFeatureRequestSchema,
  category: feedbackCategorySchema.optional(),
  page: pageSchema,
  userAgent: userAgentSchema,
});

export const submitQuizCreationReviewSchema = z.object({
  rating: ratingSchema,
  message: optionalMessageSchema,
  quizId: z.string().min(1).max(191),
  page: pageSchema,
  userAgent: userAgentSchema,
});

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;
export type SubmitUserFeedbackInput = z.infer<typeof submitUserFeedbackSchema>;
export type SubmitQuizCreationReviewInput = z.infer<
  typeof submitQuizCreationReviewSchema
>;
export type FeedbackType = z.infer<typeof feedbackTypeSchema>;
export type FeedbackStatus = z.infer<typeof feedbackStatusSchema>;
export type FeedbackCategory = z.infer<typeof feedbackCategorySchema>;
