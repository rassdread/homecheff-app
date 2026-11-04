import { createHmac, timingSafeEqual } from 'node:crypto';

export type CourierRecipientSnapshot = {
  ids: string[];
  key: string;
  exp: number;
};

const SNAPSHOT_TTL_MS = 15 * 60 * 1000;

export function courierSnapshotTtlMs(): number {
  return SNAPSHOT_TTL_MS;
}

export function signCourierRecipientSnapshot(
  input: { ids: string[]; key: string; now?: number },
  secret: string,
): string {
  const exp = (input.now ?? Date.now()) + SNAPSHOT_TTL_MS;
  const payload: CourierRecipientSnapshot = {
    ids: [...new Set(input.ids)].sort(),
    key: input.key,
    exp,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function readCourierRecipientSnapshot(
  token: string,
  secret: string,
  now = Date.now(),
): { ok: true; snapshot: CourierRecipientSnapshot } | { ok: false; error: string } {
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { ok: false, error: 'De ontvangerslijst is ongeldig. Bekijk de ontvangers opnieuw.' };
  }
  const expected = createHmac('sha256', secret).update(parts[0]).digest('base64url');
  const left = Buffer.from(parts[1]);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return { ok: false, error: 'De ontvangerslijst is ongeldig. Bekijk de ontvangers opnieuw.' };
  }
  let payload: CourierRecipientSnapshot;
  try {
    payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8')) as CourierRecipientSnapshot;
  } catch {
    return { ok: false, error: 'De ontvangerslijst is ongeldig. Bekijk de ontvangers opnieuw.' };
  }
  if (!Array.isArray(payload.ids) || typeof payload.key !== 'string' || typeof payload.exp !== 'number') {
    return { ok: false, error: 'De ontvangerslijst is ongeldig. Bekijk de ontvangers opnieuw.' };
  }
  if (payload.exp < now) {
    return { ok: false, error: 'De ontvangerslijst is verlopen. Bekijk de ontvangers opnieuw.' };
  }
  return { ok: true, snapshot: payload };
}

export function intersectCourierSnapshot(
  currentIds: string[],
  snapshotIds: string[],
): string[] {
  const allowed = new Set(snapshotIds);
  return currentIds.filter((id) => allowed.has(id));
}
