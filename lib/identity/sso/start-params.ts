/**
 * Shared SSO authorize query validation for /auth/sso/start and continue/confirm.
 */

import { SsoError } from "./constants";
import { getSsoClient, assertRedirectAllowed } from "./client-registry";
import { parseSsoInteraction, type SsoInteraction } from "./interaction";

export type SsoStartParams = {
  product: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  interaction: SsoInteraction;
  loginHint: string | null;
  /** Provider intent from product (google | password | login). */
  intent: "google" | "password" | "login" | null;
};

export function readSsoStartParams(url: URL): SsoStartParams {
  const product = url.searchParams.get("product") ?? "";
  const redirectUri = url.searchParams.get("redirect_uri") ?? "";
  const state = url.searchParams.get("state") ?? "";
  const codeChallenge = url.searchParams.get("code_challenge") ?? "";
  const codeChallengeMethod = url.searchParams.get("code_challenge_method") ?? "";
  const interaction = parseSsoInteraction(url.searchParams.get("interaction"));
  const loginHintRaw = url.searchParams.get("login_hint") ?? url.searchParams.get("email");
  const loginHint = normalizeLoginHint(loginHintRaw);
  const intentRaw = (url.searchParams.get("intent") ?? "").trim().toLowerCase();
  const intent =
    intentRaw === "google" || intentRaw === "password" || intentRaw === "login"
      ? intentRaw
      : null;

  if (!product || !redirectUri || !state || !codeChallenge || codeChallengeMethod !== "S256") {
    throw new SsoError("INVALID_REQUEST", "Invalid request");
  }

  const client = getSsoClient(product);
  assertRedirectAllowed(client, redirectUri);

  return {
    product,
    redirectUri,
    state,
    codeChallenge,
    codeChallengeMethod,
    interaction,
    loginHint,
    intent,
  };
}

export function ssoStartRelativePath(params: SsoStartParams): string {
  const q = new URLSearchParams({
    product: params.product,
    redirect_uri: params.redirectUri,
    state: params.state,
    code_challenge: params.codeChallenge,
    code_challenge_method: params.codeChallengeMethod,
    interaction: params.interaction,
  });
  if (params.loginHint) q.set("login_hint", params.loginHint);
  if (params.intent) q.set("intent", params.intent);
  return `/auth/sso/start?${q.toString()}`;
}

export function ssoContinueRelativePath(params: SsoStartParams): string {
  const q = new URLSearchParams({
    product: params.product,
    redirect_uri: params.redirectUri,
    state: params.state,
    code_challenge: params.codeChallenge,
    code_challenge_method: params.codeChallengeMethod,
    interaction: params.interaction,
  });
  if (params.loginHint) q.set("login_hint", params.loginHint);
  if (params.intent) q.set("intent", params.intent);
  return `/auth/sso/continue?${q.toString()}`;
}

function normalizeLoginHint(raw: string | null): string | null {
  if (!raw) return null;
  const email = raw.trim().toLowerCase();
  if (!email || !email.includes("@") || email.length > 254) return null;
  return email;
}
