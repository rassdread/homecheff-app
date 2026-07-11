/**
 * Phase 13T — Server-side mutation guard for API routes (defense in depth).
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  assertNotSuspended,
  type SuspensionBlockReason,
  suspensionBlockMessage,
} from '@/lib/user-suspend';

export type ActiveUserMutationContext = {
  userId: string;
  email: string | null | undefined;
};

type GuardResult =
  | { ok: true; user: ActiveUserMutationContext }
  | { ok: false; response: NextResponse };

export async function requireActiveUserForMutation(
  reason: SuspensionBlockReason = 'platform_mutation',
): Promise<GuardResult> {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const suspendBlock = await assertNotSuspended(userId, reason);
  if (suspendBlock.blocked) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: suspendBlock.message, code: 'ACCOUNT_SUSPENDED' },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true,
    user: { userId, email: session?.user?.email },
  };
}

/** Convenience for routes that already have userId — avoids duplicate session fetch. */
export async function blockIfSuspendedUser(
  userId: string,
  reason: SuspensionBlockReason = 'platform_mutation',
): Promise<NextResponse | null> {
  const suspendBlock = await assertNotSuspended(userId, reason);
  if (!suspendBlock.blocked) return null;
  return NextResponse.json(
    { error: suspensionBlockMessage(reason), code: 'ACCOUNT_SUSPENDED' },
    { status: 403 },
  );
}
