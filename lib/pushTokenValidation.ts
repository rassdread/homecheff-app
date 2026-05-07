/** FCM device tokens: ruim bereik; reject korte/lege strings. */
export const FCM_TOKEN_MIN_LEN = 32;
export const FCM_TOKEN_MAX_LEN = 4096;

export function isValidFcmTokenShape(token: unknown): token is string {
  if (typeof token !== "string") return false;
  const t = token.trim();
  return t.length >= FCM_TOKEN_MIN_LEN && t.length <= FCM_TOKEN_MAX_LEN;
}

export function maskPushTokenForLogs(token: string): string {
  const t = token.trim();
  if (t.length <= 16) return "••••";
  return `${t.slice(0, 6)}…${t.slice(-4)}`;
}
