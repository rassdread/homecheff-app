/**
 * Generated placeholders only.
 * `temp_<timestamp>_<random>` from Google sign-up, or `user_<digits>`.
 * A real username that merely contains the letters "temp" is definitive.
 */
const GENERATED_TEMP_USERNAME = /^temp_\d+_/i;
const GENERATED_USER_DIGITS = /^user_\d+$/i;

export function usernameContainsTempPlaceholder(
  username: string | null | undefined
): boolean {
  const t = username?.trim() ?? "";
  if (!t) return false;
  return GENERATED_TEMP_USERNAME.test(t) || GENERATED_USER_DIGITS.test(t);
}

/** A chosen final username may not itself be a generated placeholder. */
export function isDisallowedFinalUsername(username: string): boolean {
  return usernameContainsTempPlaceholder(username);
}
