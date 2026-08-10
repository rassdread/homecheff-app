/**
 * Phase I.2 — SSO constants & typed errors (aligned with Growth phase-i contracts).
 */

export const SSO_CODE_TTL_SECONDS = 60;
export const SSO_CODE_MIN_ENTROPY_BITS = 256;
export const SSO_ISSUER = "https://homecheff.eu" as const;

export const SSO_PRODUCTS = ["growth", "studio"] as const;
export type SsoProduct = (typeof SSO_PRODUCTS)[number];

export const SSO_ERROR_CODES = [
  "SSO_DISABLED",
  "UNAUTHORIZED_CLIENT",
  "UNAUTHORIZED",
  "INVALID_REQUEST",
  "INVALID_CODE",
  "EXPIRED_CODE",
  "USED_CODE",
  "AUDIENCE_MISMATCH",
  "REDIRECT_MISMATCH",
  "PKCE_FAILED",
  "ACCOUNT_DISABLED",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
] as const;
export type SsoErrorCode = (typeof SSO_ERROR_CODES)[number];

/** HTTP status mapping (locked by tests). */
export const SSO_ERROR_HTTP: Record<SsoErrorCode, number> = {
  SSO_DISABLED: 404,
  UNAUTHORIZED_CLIENT: 401,
  UNAUTHORIZED: 401,
  INVALID_REQUEST: 400,
  INVALID_CODE: 400,
  EXPIRED_CODE: 410,
  USED_CODE: 409,
  AUDIENCE_MISMATCH: 400,
  REDIRECT_MISMATCH: 400,
  PKCE_FAILED: 400,
  ACCOUNT_DISABLED: 403,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export const SSO_AUDIT_ACTIONS = [
  "SSO_CODE_ISSUED",
  "SSO_CODE_ISSUE_FAILED",
  "SSO_EXCHANGE_SUCCESS",
  "SSO_EXCHANGE_FAILED",
  "SSO_REPLAY_REJECTED",
  "SSO_CLIENT_REJECTED",
] as const;
export type SsoAuditAction = (typeof SSO_AUDIT_ACTIONS)[number];

export class SsoError extends Error {
  readonly code: SsoErrorCode;
  readonly httpStatus: number;

  constructor(code: SsoErrorCode, message?: string) {
    super(message ?? code);
    this.name = "SsoError";
    this.code = code;
    this.httpStatus = SSO_ERROR_HTTP[code];
  }
}
