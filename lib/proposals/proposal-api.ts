import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { ProposalServiceError } from './proposal-service';

type AuthOk = { userId: string };
type AuthFail = { error: NextResponse };

export async function resolveProposalApiUser(): Promise<AuthOk | AuthFail> {
  const session = await auth();
  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return { error: NextResponse.json({ error: 'User not found' }, { status: 404 }) };
  }

  return { userId: user.id };
}

export function handleProposalServiceError(error: unknown) {
  if (error instanceof ProposalServiceError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error('[proposal-api]', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
