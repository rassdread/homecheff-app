/**
 * Dedupe + replace optimistic temp rows when the real message arrives on Pusher.
 */
export type ChatMessageLike = {
  id: string;
  text?: string | null;
  senderId: string;
  createdAt: string;
};

export function mergePusherChatMessage<T extends ChatMessageLike>(
  prev: T[],
  incoming: T
): T[] {
  if (prev.some((m) => m.id === incoming.id)) {
    return prev;
  }
  const tempIdx = prev.findIndex(
    (m) =>
      m.id.startsWith("temp-") &&
      m.senderId === incoming.senderId &&
      (m.text ?? "") === (incoming.text ?? "")
  );
  if (tempIdx !== -1) {
    const next = [...prev];
    next[tempIdx] = incoming;
    return next.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }
  return [...prev, incoming].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}
