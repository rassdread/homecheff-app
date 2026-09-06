/**
 * Email priority classification — used for diagnostics and future stream separation.
 * P2 must never silently starve P0/P1 on a shared free-tier quota.
 */
export type EmailPriority = "P0" | "P1" | "P2";

export const EMAIL_PRIORITY = {
  /** Auth, security, payment-critical */
  P0: "P0",
  /** Orders, delivery, transactional marketplace */
  P1: "P1",
  /** Welcome, review, admin blast, engagement */
  P2: "P2",
} as const satisfies Record<EmailPriority, EmailPriority>;
