const LEGACY_CONV_KEY = "hc-conversations-list-v1";

export function conversationsListCacheKey(userId: string): string {
  return `hc-conversations-list-v2-${userId}`;
}

export function readConversationsListCache<T>(userId?: string | null): T[] {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const key = conversationsListCacheKey(userId);
    let raw = sessionStorage.getItem(key);
    if (!raw) {
      const legacy = sessionStorage.getItem(LEGACY_CONV_KEY);
      if (legacy) {
        sessionStorage.setItem(key, legacy);
        sessionStorage.removeItem(LEGACY_CONV_KEY);
        raw = sessionStorage.getItem(key);
      }
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function writeConversationsListCache<T>(
  userId: string,
  data: T[]
): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    sessionStorage.setItem(
      conversationsListCacheKey(userId),
      JSON.stringify(data)
    );
  } catch {
    /* quota / private mode */
  }
}

export function messagesCacheKey(
  conversationId: string,
  userId?: string | null
): string {
  if (userId) {
    return `hc-chat-msgs-v2-${userId}-${conversationId}`;
  }
  return `hc-chat-msgs-${conversationId}`;
}

export function readMessagesCache<T>(
  conversationId: string,
  userId?: string | null
): T[] {
  if (typeof window === "undefined" || !conversationId) return [];
  try {
    const key = messagesCacheKey(conversationId, userId);
    let raw = sessionStorage.getItem(key);
    if (!raw && userId) {
      const legacyKey = messagesCacheKey(conversationId, null);
      const legacy = sessionStorage.getItem(legacyKey);
      if (legacy) {
        sessionStorage.setItem(key, legacy);
        sessionStorage.removeItem(legacyKey);
        raw = sessionStorage.getItem(key);
      }
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function writeMessagesCache<T>(
  conversationId: string,
  messages: T[],
  userId?: string | null
): void {
  if (typeof window === "undefined" || !conversationId) return;
  try {
    const trimmed = messages.slice(-80);
    const key = messagesCacheKey(conversationId, userId ?? null);
    sessionStorage.setItem(key, JSON.stringify(trimmed));
  } catch {
    /* ignore */
  }
}
