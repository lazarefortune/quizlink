export const SIGNUP_ERROR_CODES = {
  EMAIL_ALREADY_IN_USE: "EMAIL_ALREADY_IN_USE",
} as const;

export type SignupErrorCode =
  (typeof SIGNUP_ERROR_CODES)[keyof typeof SIGNUP_ERROR_CODES];

export function isSignupErrorCode(value: string): value is SignupErrorCode {
  return Object.values(SIGNUP_ERROR_CODES).includes(value as SignupErrorCode);
}
