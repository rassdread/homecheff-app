import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  isValidDeletionConfirmation,
  performUserAccountDeletion,
} from '@/lib/account-deletion';

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const password = typeof body?.password === 'string' ? body.password : '';
    const confirmationText = body?.confirmationText;
    const locale = body?.locale === 'en' ? 'en' : 'nl';

    if (!isValidDeletionConfirmation(confirmationText, locale)) {
      return NextResponse.json({ error: 'Invalid confirmation' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        accountDeletedAt: true,
        Account: { select: { provider: true } },
      },
    });

    if (!user || user.accountDeletedAt) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const hasPassword = Boolean(user.passwordHash?.trim());
    if (hasPassword) {
      if (!password) {
        return NextResponse.json({ error: 'Password required' }, { status: 400 });
      }
      const valid = await bcrypt.compare(password, user.passwordHash!);
      if (!valid) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }
    }

    await performUserAccountDeletion(user.id);

    return NextResponse.json(
      {
        success: true,
        message: 'Account deleted',
        redirect: '/',
      },
      { status: 200 },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === 'ALREADY_DELETED') {
      return NextResponse.json({ error: 'Account already deleted' }, { status: 409 });
    }
    console.error('[delete-account]', error);
    return NextResponse.json(
      { error: 'Account deletion failed' },
      { status: 500 },
    );
  }
}
