import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  assertCompanyDispatcher,
  listActiveCompanyDrivers,
} from '@/lib/delivery/company-auth';
import {
  createCompanyDriverInvite,
  disableCompanyMember,
  revokeCompanyInvite,
} from '@/lib/delivery/company-invites';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
  }
  const companyProfileId = req.nextUrl.searchParams.get('companyProfileId') || '';
  if (!companyProfileId) {
    return NextResponse.json({ ok: false, code: 'MISSING_PROFILE' }, { status: 400 });
  }

  try {
    await assertCompanyDispatcher(session.user.id, companyProfileId);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, code: e.code || 'FORBIDDEN' },
      { status: e.status || 403 },
    );
  }

  const [drivers, invites, profile] = await Promise.all([
    listActiveCompanyDrivers(companyProfileId),
    prisma.deliveryCompanyInvite.findMany({
      where: { companyProfileId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.deliveryProfile.findUnique({
      where: { id: companyProfileId },
      select: {
        id: true,
        companyDisplayName: true,
        companyLogoUrl: true,
        isActive: true,
        isOnline: true,
        pricingEnabled: true,
        baseFeeCents: true,
        maxDistance: true,
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    profile,
    drivers: drivers.map((d) => ({
      userId: d.userId,
      role: d.role,
      status: d.status,
      name: d.user.name,
      email: d.user.email,
      profileImage: d.user.profileImage,
      place: d.user.place,
    })),
    pendingInvites: invites.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      expiresAt: i.expiresAt,
      createdAt: i.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const companyProfileId = String(body.companyProfileId || '');
  const action = String(body.action || '');

  try {
    if (action === 'invite') {
      const { invite, rawToken } = await createCompanyDriverInvite({
        companyProfileId,
        actorUserId: session.user.id,
        email: String(body.email || ''),
        role: body.role === 'DISPATCHER' ? 'DISPATCHER' : 'DRIVER',
      });
      const origin =
        process.env.NEXTAUTH_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        'https://homecheff.eu';
      return NextResponse.json({
        ok: true,
        inviteId: invite.id,
        acceptUrl: `${origin}/delivery/invite/${rawToken}`,
      });
    }

    if (action === 'revoke_invite') {
      await revokeCompanyInvite({
        inviteId: String(body.inviteId || ''),
        companyProfileId,
        actorUserId: session.user.id,
      });
      return NextResponse.json({ ok: true });
    }

    if (action === 'disable_member') {
      await disableCompanyMember({
        companyProfileId,
        memberUserId: String(body.memberUserId || ''),
        actorUserId: session.user.id,
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, code: 'UNKNOWN_ACTION' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, code: e.code || 'ERROR', message: e.message },
      { status: e.status || 500 },
    );
  }
}
