/** Stable prefix for pending accepted-value ids stored in acceptedSpecializations. */
export const PENDING_ACCEPTED_VALUE_ID_PREFIX = 'pending:';

export function isPendingAcceptedValueId(id: string): boolean {
  return id.startsWith(PENDING_ACCEPTED_VALUE_ID_PREFIX);
}

export function toPendingAcceptedValueId(dbId: string): string {
  return `${PENDING_ACCEPTED_VALUE_ID_PREFIX}${dbId}`;
}

export function parsePendingAcceptedValueDbId(id: string): string | null {
  if (!isPendingAcceptedValueId(id)) return null;
  const dbId = id.slice(PENDING_ACCEPTED_VALUE_ID_PREFIX.length).trim();
  return dbId || null;
}
