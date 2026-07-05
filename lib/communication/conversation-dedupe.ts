import type { ConversationContextType } from '@prisma/client';

/**
 * Build a stable dedupe key for 1-on-1 conversations in a given context.
 * Used when starting threads — not enforced at DB level in Phase 1.
 */
export function buildConversationDedupeKey(params: {
  participantIds: [string, string];
  contextType: ConversationContextType;
  contextId: string | null;
}): string {
  const sorted = [...params.participantIds].sort();
  const ctx = params.contextId?.trim() || '_general';
  return `${params.contextType}:${ctx}:${sorted[0]}:${sorted[1]}`;
}
