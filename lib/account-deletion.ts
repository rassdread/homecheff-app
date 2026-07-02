/**
 * User-initiated account deletion (Google Play / GDPR).
 *
 * RETENTION POLICY (summary):
 * - Immediate: login disabled, sessions/OAuth/push tokens removed, PII anonymized, public content hidden.
 * - Retained internally (typically 6–24 months or as legally required):
 *   orders, payments, payouts, Stripe Connect refs, transaction messages tied to orders,
 *   moderation reports, audit/security logs, fraud/dispute evidence.
 */

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import type { Prisma } from '@prisma/client';

export const ACCOUNT_DELETION_CONFIRM_NL = 'VERWIJDEREN';
export const ACCOUNT_DELETION_CONFIRM_EN = 'DELETE';

export function isValidDeletionConfirmation(text: unknown, locale?: string): boolean {
  if (typeof text !== 'string') return false;
  const t = text.trim().toUpperCase();
  if (locale === 'en') return t === ACCOUNT_DELETION_CONFIRM_EN;
  if (locale === 'nl') return t === ACCOUNT_DELETION_CONFIRM_NL;
  return t === ACCOUNT_DELETION_CONFIRM_NL || t === ACCOUNT_DELETION_CONFIRM_EN;
}

export function isAccountDeleted(
  user: { accountDeletedAt?: Date | string | null } | null | undefined,
): boolean {
  return Boolean(user?.accountDeletedAt);
}

function tombstoneEmail(userId: string): string {
  return `deleted+${userId}@accounts.homecheff.internal`;
}

function tombstoneUsername(userId: string): string {
  return `deleted_${userId.replace(/-/g, '').slice(0, 24)}`;
}

/** Best-effort Stripe seller subscription cancel (does not delete Connect account — payout/tax records). */
async function cancelStripeSubscriptionsBestEffort(stripeSubscriptionIds: string[]): Promise<void> {
  if (!stripe || stripeSubscriptionIds.length === 0) return;
  for (const subId of stripeSubscriptionIds) {
    if (!subId?.trim()) continue;
    try {
      await stripe.subscriptions.cancel(subId);
    } catch (err) {
      console.warn(
        '[account-deletion] Stripe subscription cancel failed',
        subId,
        err instanceof Error ? err.message : err,
      );
    }
  }
}

export type PerformAccountDeletionResult = {
  ok: true;
  deletedAt: string;
  previousEmail: string;
};

export async function performUserAccountDeletion(
  userId: string,
): Promise<PerformAccountDeletionResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      SellerProfile: true,
      Account: true,
    },
  });

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }
  if (user.accountDeletedAt) {
    throw new Error('ALREADY_DELETED');
  }

  const stripeSubIds = [
    user.SellerProfile?.stripeSubscriptionId,
  ].filter((id): id is string => Boolean(id?.trim()));

  await cancelStripeSubscriptionsBestEffort(stripeSubIds);

  const deletedAt = new Date();
  const previousEmail = user.email;

  await prisma.$transaction(async (tx) => {
    const sellerProfileId = user.SellerProfile?.id ?? null;

    // --- Immediate removal: sessions, OAuth, push/device tokens ---
    await tx.session.deleteMany({ where: { userId } });
    await tx.account.deleteMany({ where: { userId } });
    await tx.pushToken.deleteMany({ where: { userId } });
    await tx.deviceToken.deleteMany({ where: { userId } });

    // --- Social / preferences (not legally required) ---
    await tx.favorite.deleteMany({ where: { userId } });
    await tx.follow.deleteMany({
      where: { OR: [{ followerId: userId }, { sellerId: userId }] },
    });
    await tx.fanRequest.deleteMany({
      where: { OR: [{ requesterId: userId }, { targetId: userId }] },
    });
    await tx.notification.deleteMany({ where: { userId } });
    await tx.notificationPreferences.deleteMany({ where: { userId } });
    await tx.encryptionKey.deleteMany({ where: { userId } });
    await tx.userHcpStats.deleteMany({ where: { userId } });
    await tx.hcpEvent.deleteMany({ where: { userId } });
    await tx.userBadge.deleteMany({ where: { userId } });
    await tx.userHcpReward.deleteMany({ where: { userId } });

    // --- Hide public listings ---
    await tx.listing.updateMany({
      where: { ownerId: userId },
      data: { isPublic: false, status: 'REMOVED' },
    });

    // --- Hide seller products (retain rows for order history) ---
    if (sellerProfileId) {
      await tx.product.updateMany({
        where: { sellerId: sellerProfileId },
        data: { isActive: false },
      });
    }

    // --- Remove public creative content (dishes / workspace); orders retain product refs ---
    const dishIds = (
      await tx.dish.findMany({ where: { userId }, select: { id: true } })
    ).map((d) => d.id);
    if (dishIds.length > 0) {
      await tx.dishPhoto.deleteMany({ where: { dishId: { in: dishIds } } });
      await tx.recipeStepPhoto.deleteMany({ where: { dishId: { in: dishIds } } });
      await tx.gardenGrowthPhoto.deleteMany({ where: { dishId: { in: dishIds } } });
      await tx.dishReview.deleteMany({ where: { dishId: { in: dishIds } } });
      await tx.favorite.deleteMany({ where: { dishId: { in: dishIds } } });
      await tx.dish.deleteMany({ where: { id: { in: dishIds } } });
    }

    if (sellerProfileId) {
      const workspaceIds = (
        await tx.workspaceContent.findMany({
          where: { sellerProfileId },
          select: { id: true },
        })
      ).map((w) => w.id);
      for (const wcId of workspaceIds) {
        await tx.workspaceContentPhoto.deleteMany({ where: { workspaceContentId: wcId } });
        await tx.workspaceContentProp.deleteMany({ where: { workspaceContentId: wcId } });
        await tx.workspaceContentComment.deleteMany({ where: { workspaceContentId: wcId } });
        await tx.recipe.deleteMany({ where: { workspaceContentId: wcId } });
        await tx.growingProcess.deleteMany({ where: { workspaceContentId: wcId } });
        await tx.designItem.deleteMany({ where: { workspaceContentId: wcId } });
      }
      await tx.workspaceContent.deleteMany({ where: { sellerProfileId } });
      await tx.workplacePhoto.deleteMany({ where: { sellerProfileId } });
    }

    // --- Messages: soft-delete content; retain row for dispute/transaction context ---
    await tx.message.updateMany({
      where: { senderId: userId },
      data: {
        deletedAt,
        text: null,
        encryptedText: null,
        attachmentUrl: null,
        attachmentName: null,
        attachmentType: null,
      },
    });

    await tx.conversationParticipant.deleteMany({ where: { userId } });

    // --- Delivery profile: deactivate + strip address ---
    await tx.deliveryProfile.updateMany({
      where: { userId },
      data: {
        isActive: false,
        bio: null,
        homeAddress: null,
        currentAddress: null,
        homeLat: null,
        homeLng: null,
        currentLat: null,
        currentLng: null,
      },
    });

    if (sellerProfileId) {
      await tx.sellerProfile.update({
        where: { id: sellerProfileId },
        data: {
          displayName: null,
          bio: null,
          companyName: null,
          kvk: null,
          btw: null,
          lat: null,
          lng: null,
          stripeSubscriptionId: null,
          subscriptionValidUntil: null,
        },
      });
    }

    // --- Anonymize user (retain id for FK on orders/payouts/reports) ---
    const anonymized: Prisma.UserUpdateInput = {
      accountDeletedAt: deletedAt,
      email: tombstoneEmail(userId),
      username: tombstoneUsername(userId),
      passwordHash: null,
      name: null,
      bio: null,
      quote: null,
      profileImage: null,
      image: null,
      phoneNumber: null,
      publicPhoneEnabled: false,
      publicPhoneNumber: null,
      publicWhatsappEnabled: false,
      publicWhatsappNumber: null,
      publicInstagramEnabled: false,
      instagramUrl: null,
      publicFacebookEnabled: false,
      facebookUrl: null,
      publicTikTokEnabled: false,
      tiktokUrl: null,
      publicWebsiteEnabled: false,
      websiteUrl: null,
      publicTelegramEnabled: false,
      telegramUrl: null,
      address: null,
      city: null,
      postalCode: null,
      state: null,
      country: null,
      iban: null,
      bankName: null,
      accountHolderName: null,
      emailVerificationToken: null,
      emailVerificationCode: null,
      emailVerificationExpires: null,
      emailVerified: null,
      interests: [],
      lat: null,
      lng: null,
      place: null,
      dateOfBirth: null,
      showProfileToEveryone: false,
      showFansList: false,
      allowProfileViews: false,
      fanRequestEnabled: false,
      showOnlineStatus: false,
      showActivityStatus: false,
      marketingAccepted: false,
      gender: null,
    };

    await tx.user.update({
      where: { id: userId },
      data: anonymized,
    });

    // TODO(GDPR_DYNAMIC_SELLER): verwijder/anonymiseer DynamicSeller.contactPhone/contactEmail bij account deletion

    // Audit trail (retained; no PII in meta beyond hashed id reference)
    await tx.auditLog.create({
      data: {
        id: randomUUID(),
        userId,
        action: 'ACCOUNT_DELETION_COMPLETED',
        meta: {
          deletedAt: deletedAt.toISOString(),
          retentionNote:
            'Orders, payments, payouts, moderation and security records may be retained per legal obligations.',
        },
      },
    });
  });

  return {
    ok: true,
    deletedAt: deletedAt.toISOString(),
    previousEmail,
  };
}
