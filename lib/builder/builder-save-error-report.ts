export type BuilderSaveErrorPhase =
  | "manual_save"
  | "autosave"
  | "finalize"
  | "save_as_draft_copy";

export type BuilderSaveErrorMetadataInput = {
  phase: BuilderSaveErrorPhase;
  locale: string;
  pathname: string;
  quizId?: string | null;
  savedQuizId?: string | null;
  urlQuizId?: string | null;
  quizStatus?: string | null;
  questionCount?: number;
  errorMessage?: string;
  errorCode?: string;
  payloadSizeBytes?: number;
  isDraft?: boolean;
  isActive?: boolean;
};

const MAX_ERROR_MESSAGE_LENGTH = 500;

function sanitizeErrorMessage(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.replace(/[\r\n]+/g, " ").trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  return trimmed.slice(0, MAX_ERROR_MESSAGE_LENGTH);
}

function sanitizeErrorCode(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  return trimmed.slice(0, 100);
}

export function buildBuilderSaveErrorMetadata(
  input: BuilderSaveErrorMetadataInput,
): Record<string, string | number | boolean> {
  const metadata: Record<string, string | number | boolean> = {
    source: "builder_save_error",
    phase: input.phase,
    locale: input.locale,
    pathname: input.pathname,
  };

  if (input.quizId) {
    metadata.quizId = input.quizId;
  }

  if (input.savedQuizId) {
    metadata.savedQuizId = input.savedQuizId;
  }

  if (input.urlQuizId) {
    metadata.urlQuizId = input.urlQuizId;
  }

  if (input.quizStatus) {
    metadata.quizStatus = input.quizStatus;
  }

  if (input.questionCount !== undefined) {
    metadata.questionCount = input.questionCount;
  }

  const errorMessage = sanitizeErrorMessage(input.errorMessage);
  if (errorMessage) {
    metadata.errorMessage = errorMessage;
  }

  const errorCode = sanitizeErrorCode(input.errorCode);
  if (errorCode) {
    metadata.errorCode = errorCode;
  }

  if (input.payloadSizeBytes !== undefined) {
    metadata.payloadSizeBytes = input.payloadSizeBytes;
  }

  if (input.isDraft !== undefined) {
    metadata.isDraft = input.isDraft;
  }

  if (input.isActive !== undefined) {
    metadata.isActive = input.isActive;
  }

  return metadata;
}
