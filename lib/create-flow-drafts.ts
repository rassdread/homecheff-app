/**
 * Session-scoped create-flow drafts (6 combinations: vertical × mode).
 * Storage: sessionStorage only (per browser tab/session).
 */

export type CreateDraftVertical = "CHEFF" | "GARDEN" | "DESIGNER";
export type CreateDraftMode = "dorpsplein" | "inspiratie";

export type CreateFlowDraftIntent = {
  userId: string | null | undefined;
  vertical: CreateDraftVertical;
  mode: CreateDraftMode;
};

export type CreateFlowDraftEnvelope<T = unknown> = {
  version: 1;
  vertical: CreateDraftVertical;
  mode: CreateDraftMode;
  formType: string;
  updatedAt: number;
  /** Optional pointer if media lives in sessionStorage under known keys */
  mediaHint?: string | null;
  data: T;
};

function uidPart(userId: string | null | undefined): string {
  const u = userId?.trim();
  return u && u.length > 0 ? u : "anon";
}

/** homecheff:create-draft:{userIdOrAnon}:{mode}:{vertical} */
export function draftStorageKey(intent: CreateFlowDraftIntent): string {
  return `homecheff:create-draft:${uidPart(intent.userId)}:${intent.mode}:${intent.vertical}`;
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function saveDraft<T>(
  intent: CreateFlowDraftIntent,
  formType: string,
  data: T,
  mediaHint?: string | null
): void {
  const store = getStorage();
  if (!store) return;
  const envelope: CreateFlowDraftEnvelope<T> = {
    version: 1,
    vertical: intent.vertical,
    mode: intent.mode,
    formType,
    updatedAt: Date.now(),
    mediaHint: mediaHint ?? null,
    data,
  };
  try {
    store.setItem(draftStorageKey(intent), JSON.stringify(envelope));
  } catch {
    try {
      const minimal = { ...envelope, data: stripLargeDataUrls(data) as T };
      store.setItem(draftStorageKey(intent), JSON.stringify(minimal));
    } catch {
      /* quota — ignore */
    }
  }
}

function stripLargeDataUrls<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (typeof data === "string") {
    if (data.startsWith("data:") && data.length > 40_000) {
      return "[omitted-large-data-url]" as T;
    }
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((x) => stripLargeDataUrls(x)) as T;
  }
  if (typeof data === "object") {
    const o = data as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(o)) {
      out[k] = stripLargeDataUrls(o[k]);
    }
    return out as T;
  }
  return data;
}

export function loadDraft<T>(intent: CreateFlowDraftIntent): CreateFlowDraftEnvelope<T> | null {
  const store = getStorage();
  if (!store) return null;
  try {
    const raw = store.getItem(draftStorageKey(intent));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CreateFlowDraftEnvelope<T>;
    if (!parsed || parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearDraft(intent: CreateFlowDraftIntent): void {
  const store = getStorage();
  if (!store) return;
  try {
    store.removeItem(draftStorageKey(intent));
  } catch {
    /* ignore */
  }
}

export function hasDraft(intent: CreateFlowDraftIntent): boolean {
  const store = getStorage();
  if (!store) return false;
  try {
    return store.getItem(draftStorageKey(intent)) !== null;
  } catch {
    return false;
  }
}
