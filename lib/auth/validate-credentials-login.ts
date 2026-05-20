export type CredentialsLoginUser = {
  passwordHash: string | null;
  emailVerifiedAt: Date | null;
};

export type CredentialsLoginRejection =
  | "USER_NOT_FOUND"
  | "NO_PASSWORD"
  | "EMAIL_NOT_VERIFIED";

/**
 * Returns a rejection reason when credentials sign-in must not proceed, or null when allowed.
 */
export function getCredentialsLoginRejection(
  user: CredentialsLoginUser | null | undefined,
): CredentialsLoginRejection | null {
  if (!user) {
    return "USER_NOT_FOUND";
  }

  if (!user.passwordHash) {
    return "NO_PASSWORD";
  }

  if (!user.emailVerifiedAt) {
    return "EMAIL_NOT_VERIFIED";
  }

  return null;
}
