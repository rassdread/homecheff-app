const CONV_KEY = "hc-conversations-list-v1";

export function readConversationsListCache<T>(): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(CONV_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function writeConversationsListCache<T>(data: T[]): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CONV_KEY, JSON.stringify(data));
  } catch {
    /* quota / private mode */
  }
}

export function messagesCacheKey(conversationId: string): string {
  return `hc-chat-msgs-${conversationId}`;
}

export function readMessagesCache<T>(conversationId: string): T[] {
  if (typeof window === "undefined" || !conversationId) return [];
  try {
    const raw = sessionStorage.getItem(messagesCacheKey(conversationId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function writeMessagesCache<T>(
  conversationId: string,
  messages: T[]
): void {
  if (typeof window === "undefined" || !conversationId) return;
  try {
    const trimmed = messages.slice(-80);
    sessionStorage.setItem(
      messagesCacheKey(conversationId),
      JSON.stringify(trimmed)
    );
  } catch {
    /* ignore */
  }
}
