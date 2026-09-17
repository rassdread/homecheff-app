import { performUserAccountDeletion } from '@/lib/account-deletion';
import { prisma } from '@/lib/prisma';
import {
  isDisposableCertEmail,
  isInternalTestKeepEmail,
  isInternalTestKeepUsername,
} from '@/lib/certification/internal-test-identities';

export type DisposeTempFixturesResult = {
  requested: number;
  disposed: number;
  skippedKeep: number;
  skippedAlreadyDeleted: number;
  skippedNonDisposable: number;
  errors: Array<{ id: string; error: string }>;
};

/**
 * Canonical cleanup for temporary production certification users.
 * Uses performUserAccountDeletion (keeps orders / Stripe Connect refs).
 * Never touches MediaCert keep identities or real-domain accounts.
 */
export async function disposeTempCertificationUsers(
  userIds: string[],
): Promise<DisposeTempFixturesResult> {
  const unique = [...new Set(userIds.filter((id) => typeof id === 'string' && id.trim()))];
  const result: DisposeTempFixturesResult = {
    requested: unique.length,
    disposed: 0,
    skippedKeep: 0,
    skippedAlreadyDeleted: 0,
    skippedNonDisposable: 0,
    errors: [],
  };

  for (const id of unique) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          username: true,
          accountDeletedAt: true,
        },
      });
      if (!user) {
        result.skippedAlreadyDeleted += 1;
        continue;
      }
      if (isInternalTestKeepEmail(user.email) || isInternalTestKeepUsername(user.username)) {
        result.skippedKeep += 1;
        continue;
      }
      if (!isDisposableCertEmail(user.email)) {
        result.skippedNonDisposable += 1;
        continue;
      }
      if (user.accountDeletedAt) {
        result.skippedAlreadyDeleted += 1;
        continue;
      }
      await performUserAccountDeletion(id);
      result.disposed += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message === 'ALREADY_DELETED') {
        result.skippedAlreadyDeleted += 1;
        continue;
      }
      result.errors.push({ id, error: message });
    }
  }

  return result;
}
