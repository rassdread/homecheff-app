/**
 * SP.2B.3 — SSO interaction modes (IdP account selection).
 *
 * silent          — reuse existing HomeCheff session when present (returning SSO)
 * login           — interactive login; confirm or switch if already signed in
 * select_account  — explicit account selection (Google / email / switch)
 * claim           — product account claim; always confirm identity (never silent)
 *
 * Missing / unknown → silent (Growth + legacy callers keep returning-user UX).
 */

export const SSO_INTERACTIONS = [
  "silent",
  "login",
  "select_account",
  "claim",
] as const;

export type SsoInteraction = (typeof SSO_INTERACTIONS)[number];

export function parseSsoInteraction(raw: string | null | undefined): SsoInteraction {
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "login" || v === "select_account" || v === "claim" || v === "silent") {
    return v;
  }
  return "silent";
}

/** True when an existing session must not auto-issue a code. */
export function requiresInteractiveConfirmation(interaction: SsoInteraction): boolean {
  return interaction === "login" || interaction === "select_account" || interaction === "claim";
}

export function googlePromptForInteraction(interaction: SsoInteraction): "select_account" | undefined {
  if (interaction === "select_account" || interaction === "login" || interaction === "claim") {
    return "select_account";
  }
  return undefined;
}
