/**
 * A deliberate Google click must open Google's account chooser.
 * Without this, Google reuses the last chosen account and skips
 * "Use another account".
 */
export const GOOGLE_ACCOUNT_CHOOSER_PARAMS = {
  prompt: "select_account",
} as const;
