export type AiLimits = {
  minTextLength: number;
  maxTextLength: number | null;
  maxQuestions: number;
  allowFileUpload: boolean;
  allowAudio: boolean;
  allowVideo: boolean;
};

export function getAiLimits(): AiLimits {
  return {
    minTextLength: 100,
    maxTextLength: null,
    maxQuestions: 50,
    allowFileUpload: true,
    allowAudio: true,
    allowVideo: true,
  };
}

export function validateTextLength(
  text: string,
  limits: AiLimits
): { valid: boolean } {
  if (text.length < limits.minTextLength) {
    return { valid: false };
  }

  if (limits.maxTextLength !== null && text.length > limits.maxTextLength) {
    return { valid: false };
  }

  return { valid: true };
}

export function validateQuestionCount(
  count: number,
  limits: AiLimits
): { valid: boolean } {
  if (count > limits.maxQuestions) {
    return { valid: false };
  }

  if (count < 1) {
    return { valid: false };
  }

  return { valid: true };
}
