/**
 * Centrale regels: browsen blijft open; actieve acties (berichten, plaatsen, verkopen) pas na verificatie + definitieve username (+ voorwaarden / Stripe waar van toepassing).
 */

import { usernameContainsTempPlaceholder } from '@/lib/username-placeholder';

export type AccountRequirementsAction = 'sendMessage' | 'postItem' | 'sell';

export type MissingRequirementKey =
  | 'emailVerified'
  | 'username'
  | 'termsAccepted'
  | 'stripeOnboarding';

export type MissingRequirement = {
  key: MissingRequirementKey;
  label: string;
  actionHref: string;
};

export type AccountRequirementsUserInput = {
  emailVerified?: Date | string | null;
  username?: string | null;
  termsAccepted?: boolean | null;
  passwordHash?: string | null;
  stripeConnectAccountId?: string | null;
  stripeConnectOnboardingCompleted?: boolean | null;
  Account?: { provider: string }[] | null;
};

export type AccountRequirementsSnapshot = {
  canBrowse: true;
  canPostItem: boolean;
  canSendMessage: boolean;
  canSell: boolean;
  canReceivePayments: boolean;
  missing: MissingRequirement[];
};

const MISSING_EMAIL: MissingRequirement = {
  key: 'emailVerified',
  label: 'Verifieer je e-mailadres',
  actionHref: '/verify-email',
};

const MISSING_USERNAME: MissingRequirement = {
  key: 'username',
  label: 'Kies een definitieve gebruikersnaam',
  actionHref: '/profile',
};

const MISSING_TERMS: MissingRequirement = {
  key: 'termsAccepted',
  label: 'Accepteer de algemene voorwaarden',
  actionHref: '/profile',
};

const MISSING_STRIPE: MissingRequirement = {
  key: 'stripeOnboarding',
  label: 'Stel je betalingen in',
  actionHref: '/verkoper/dashboard',
};

/** Lege of tijdelijke patronen (temp_…, user_123) tellen niet als definitieve username. */
export function needsDefinitiveUsername(username: string | null | undefined): boolean {
  if (!username?.trim()) return true;
  const t = username.trim();
  if (usernameContainsTempPlaceholder(t)) return true;
  if (/^user_\d+$/i.test(t)) return true;
  return false;
}

/** @deprecated Gebruik needsDefinitiveUsername; alias voor duidelijkheid in specs. */
export function isTemporaryUsername(username: string | null | undefined): boolean {
  return needsDefinitiveUsername(username);
}

/**
 * Google-only accounts zonder lokaal wachtwoord: provider e-mail wordt als betrouwbaar beschouwd
 * wanneer de database nog geen emailVerified heeft (legacy / edge).
 */
export function isEmailVerifiedForAccountRequirements(
  user: AccountRequirementsUserInput
): boolean {
  if (user.emailVerified != null) {
    return true;
  }
  const noLocalPassword = !user.passwordHash || user.passwordHash.length === 0;
  const hasGoogle =
    user.Account?.some((a) => String(a.provider).toLowerCase() === 'google') ?? false;
  if (hasGoogle && noLocalPassword) {
    return true;
  }
  return false;
}

export function missingRequirementsForAction(
  action: AccountRequirementsAction,
  fullMissing: MissingRequirement[]
): MissingRequirement[] {
  if (action === 'sendMessage') {
    return fullMissing.filter(
      (m) => m.key === 'emailVerified' || m.key === 'username'
    );
  }
  if (action === 'postItem') {
    return fullMissing.filter((m) => m.key !== 'stripeOnboarding');
  }
  return fullMissing;
}

export function getAccountRequirements(
  user: AccountRequirementsUserInput | null | undefined
): AccountRequirementsSnapshot {
  const canBrowse = true as const;
  if (!user) {
    return {
      canBrowse,
      canPostItem: false,
      canSendMessage: false,
      canSell: false,
      canReceivePayments: false,
      missing: [],
    };
  }

  const emailOk = isEmailVerifiedForAccountRequirements(user);
  const usernameOk = !needsDefinitiveUsername(user.username);
  const termsOk = !!user.termsAccepted;
  const stripeIncomplete =
    !!user.stripeConnectAccountId && !user.stripeConnectOnboardingCompleted;

  const missing: MissingRequirement[] = [];
  if (!emailOk) missing.push(MISSING_EMAIL);
  if (!usernameOk) missing.push(MISSING_USERNAME);
  if (!termsOk) missing.push(MISSING_TERMS);
  if (stripeIncomplete) missing.push(MISSING_STRIPE);

  const canSendMessage = emailOk && usernameOk;
  const canPostItem = canSendMessage && termsOk;
  const canSell = canPostItem && !stripeIncomplete;

  return {
    canBrowse,
    canPostItem,
    canSendMessage,
    canSell,
    canReceivePayments: canSell,
    missing,
  };
}

export function missingRequirements(
  user: AccountRequirementsUserInput | null | undefined,
  action: AccountRequirementsAction
): MissingRequirement[] {
  const snap = getAccountRequirements(user);
  return missingRequirementsForAction(action, snap.missing);
}
