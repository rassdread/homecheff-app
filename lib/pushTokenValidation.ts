/** FCM device tokens: ruim bereik; reject korte/lege strings. */
export const FCM_TOKEN_MIN_LEN = 32;
export const FCM_TOKEN_MAX_LEN = 4096;

export function isValidFcmTokenShape(token: unknown): token is string {
  if (typeof token !== "string") return false;
  const t = token.trim();
  return t.length >= FCM_TOKEN_MIN_LEN && t.length <= FCM_TOKEN_MAX_LEN;
}

export type PushRegistrationRow = {
  token?: string | null;
  isActive?: boolean | null;
  type?: string | null;
  platform?: string | null;
};

/**
 * Same acceptance as the admin FCM send: an active FCM registration for the app or the browser.
 * Inactive, revoked and malformed tokens are not usable. A blank platform stays usable so older rows still send.
 */
export function isUsableRegisteredPushToken(row: PushRegistrationRow): boolean {
  if (row.isActive === false) return false;
  if (typeof row.type === "string" && row.type !== "FCM") return false;
  const platform = typeof row.platform === "string" ? row.platform.trim().toLowerCase() : "";
  if (platform && platform !== "android" && platform !== "ios" && platform !== "web") return false;
  return isValidFcmTokenShape(row.token);
}

/** Several devices or a browser plus an app still count as one person. */
export function hasUsablePushRegistration(rows: readonly PushRegistrationRow[]): boolean {
  return rows.some((row) => isUsableRegisteredPushToken(row));
}

export function maskPushTokenForLogs(token: string): string {
  const t = token.trim();
  if (t.length <= 16) return "••••";
  return `${t.slice(0, 6)}…${t.slice(-4)}`;
}
