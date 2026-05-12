/**
 * Dedupe + replace optimistic temp rows when the real message arrives on Pusher.
 */
import { reportMessagingDiagnostic } from "@/lib/chat/messagingDiagnostics";

export type ChatMessageLike = {
  id: string;
  text?: string | null;
  senderId: string;
  createdAt: string;
};

function validIso(iso: unknown): boolean {
  return (
    typeof iso === "string" &&
    iso.trim().length > 0 &&
    Number.isFinite(Date.parse(iso))
  );
}

function mid(m: ChatMessageLike | null | undefined): string {
  if (!m || typeof m.id !== "string") return "";
  return m.id.trim();
}

export function mergePusherChatMessage<T extends ChatMessageLike>(
  prev: T[],
  incoming: T
): T[] {
  if (!incoming || typeof incoming !== "object") {
    reportMessagingDiagnostic("pusher_msg_rejected", { reason: "not_object" });
    return Array.isArray(prev) ? prev : [];
  }
  const iid = mid(incoming);
  const sid =
    typeof incoming.senderId === "string"
      ? incoming.senderId.trim()
      : "";
  if (!iid || !sid || !validIso(incoming.createdAt)) {
    reportMessagingDiagnostic("pusher_msg_rejected", { reason: "bad_shape" });
    return Array.isArray(prev) ? prev : [];
  }

  const prevSafe = Array.isArray(prev) ? prev : [];

  if (prevSafe.some((m) => mid(m) === iid)) {
    return prevSafe;
  }
  const dupIdx = prevSafe.findIndex(
    (m) => {
      const mId = mid(m);
      return (
        !!mId &&
        mId !== iid &&
        !mId.startsWith("temp-") &&
        m.senderId === sid &&
        (m.text ?? "") === (incoming.text ?? "") &&
        validIso(m.createdAt) &&
        Math.abs(
          new Date(m.createdAt).getTime() -
            new Date(incoming.createdAt).getTime()
        ) < 15000
      );
    }
  );
  if (dupIdx !== -1) {
    const next = [...prevSafe];
    next[dupIdx] = incoming;
    return next.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }
  const tempIdx = prevSafe.findIndex(
    (m) => {
      const mId = mid(m);
      return (
        mId.startsWith("temp-") &&
        m.senderId === sid &&
        (m.text ?? "") === (incoming.text ?? "")
      );
    }
  );
  if (tempIdx !== -1) {
    const next = [...prevSafe];
    next[tempIdx] = incoming;
    return next.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }
  return [...prevSafe, incoming].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}
