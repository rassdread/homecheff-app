/** Deleted/tombstoned accounts must never start or complete re-authentication. */
export function isTombstonedAccount(
  user: { accountDeletedAt?: Date | string | null } | null | undefined,
): boolean {
  return Boolean(user?.accountDeletedAt);
}

/**
 * Password-reset mail/token is only allowed for a live account that still has a password.
 * Tombstones return the same "not eligible" path as unknown/OAuth-only users (no enumeration).
 */
export function passwordResetEligible(
  user:
    | {
        passwordHash?: string | null;
        accountDeletedAt?: Date | string | null;
      }
    | null
    | undefined,
): boolean {
  if (!user?.passwordHash) return false;
  if (isTombstonedAccount(user)) return false;
  return true;
}
