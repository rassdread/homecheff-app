/** A retried metadata save of the same stored object must not insert a second row. */
export function shouldReuseExistingUpload(input: {
  existing: { mediaUrl: string; creatorUserId: string; deletedAt: Date | null } | null;
  mediaUrl: string;
  creatorUserId: string;
}): boolean {
  const existing = input.existing;
  if (!existing || existing.deletedAt) return false;
  if (!input.mediaUrl || existing.mediaUrl !== input.mediaUrl) return false;
  return existing.creatorUserId === input.creatorUserId;
}
