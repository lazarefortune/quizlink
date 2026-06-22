/**
 * Active legal document versions. Bump when CGU or privacy policy content changes
 * meaningfully; persist accepted version on User at acceptance time.
 */
export const CURRENT_TERMS_VERSION = "1.1";
export const CURRENT_PRIVACY_VERSION = "1.1";

/** CGV / terms of sale — display version on /legal/sales only (not stored on User). */
export const CURRENT_SALES_VERSION = "1.1";
