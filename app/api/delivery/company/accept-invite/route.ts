import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { acceptCompanyDriverInvite } from '@/lib/delivery/company-invites';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const token = String(body.token || '');
  if (!token) {
    return NextResponse.json({ ok: false, code: 'MISSING_TOKEN' }, { status: 400 });
  }

  try {
    const result = await acceptCompanyDriverInvite({
      rawToken: token,
      userId: session.user.id,
      userEmail: session.user.email,
    });
    return NextResponse.json({
      ok: true,
      companyProfileId: result.companyProfileId,
      role: result.member.role,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, code: e.code || 'ERROR', message: e.message },
      { status: e.status || 500 },
    );
  }
}
