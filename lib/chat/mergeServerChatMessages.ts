import type { ChatThreadMessage } from "@/components/chat/chatThreadTypes";

function textKey(senderId: string, text: string | null | undefined): string {
  return `${senderId}\t${(text ?? "").trim()}`;
}

/**
 * Poll/refresh: server is authoritative per message id; behoud oudere berichten die niet
 * in deze server-slice zitten; vervang overlappende ids; verwijder optimistic temp-* als
 * er een echt bericht metzelfde afzender+tekst is.
 */
export function mergeServerChatMessages(
  prev: ChatThreadMessage[],
  serverSlice: ChatThreadMessage[]
): ChatThreadMessage[] {
  const map = new Map<string, ChatThreadMessage>();
  for (const m of prev) {
    map.set(m.id, m);
  }
  for (const m of serverSlice) {
    map.set(m.id, m);
  }

  const nonTemp = [...map.values()].filter((m) => !m.id.startsWith("temp-"));
  const coveredKeys = new Set(nonTemp.map((m) => textKey(m.senderId, m.text)));

  const merged = [...map.values()].filter((m) => {
    if (!m.id.startsWith("temp-")) return true;
    return !coveredKeys.has(textKey(m.senderId, m.text));
  });

  return merged.sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}
