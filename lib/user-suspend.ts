/**
 * Phase 13E — User suspension checks (non-destructive moderation).
 */

import { prisma } from '@/lib/prisma';

export type SuspensionBlockReason =
  | 'checkout'
  | 'listing'
  | 'messaging'
  | 'affiliate_payout'
  | 'delivery_claim'
  | 'admin_access'
  | 'platform_mutation'
  | 'review'
  | 'favorite'
  | 'proposal'
  | 'subscription';

const BLOCK_MESSAGES: Record<SuspensionBlockReason, string> = {
  checkout: 'Je account is tijdelijk geblokkeerd. Neem contact op met support.',
  listing: 'Je kunt geen listings plaatsen terwijl je account is geschorst.',
  messaging: 'Je kunt geen berichten versturen terwijl je account is geschorst.',
  affiliate_payout: 'Uitbetalingen zijn geblokkeerd voor dit account.',
  delivery_claim: 'Bezorgopdrachten zijn niet beschikbaar voor dit account.',
  admin_access: 'Admin-toegang is geblokkeerd voor dit account.',
  platform_mutation: 'Je account is tijdelijk geschorst. Neem contact op met support.',
  review: 'Je kunt geen reviews plaatsen terwijl je account is geschorst.',
  favorite: 'Je kunt geen favorieten of volgers beheren terwijl je account is geschorst.',
  proposal: 'Je kunt geen voorstellen doen terwijl je account is geschorst.',
  subscription: 'Abonnementsacties zijn geblokkeerd terwijl je account is geschorst.',
};

export function suspensionBlockMessage(reason: SuspensionBlockReason): string {
  return BLOCK_MESSAGES[reason];
}

export async function isUserSuspended(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { suspendedAt: true, accountDeletedAt: true, role: true },
  });
  if (!user || user.accountDeletedAt) return true;
  if (user.role === 'SUPERADMIN') return false;
  return Boolean(user.suspendedAt);
}

export async function assertNotSuspended(
  userId: string,
  reason: SuspensionBlockReason,
): Promise<{ blocked: boolean; message: string }> {
  const suspended = await isUserSuspended(userId);
  if (!suspended) return { blocked: false, message: '' };
  return { blocked: true, message: suspensionBlockMessage(reason) };
}
