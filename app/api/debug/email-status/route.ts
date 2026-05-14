import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getEmailDeliveryConfigSnapshot } from '@/lib/email-delivery-status';
import { getCorsHeaders } from '@/lib/apiCors';

export const dynamic = 'force-dynamic';

/**
 * Safe production e-mail config snapshot (no secrets).
 * Production: ADMIN / SUPERADMIN only. Non-production: any authenticated user.
 */
export async function GET(req: NextRequest) {
  const cors = getCorsHeaders(req);
  const headers = {
    ...cors,
    'Cache-Control': 'private, no-store, max-age=0',
  };

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  const role = (session.user as { role?: string }).role;
  const isAdmin = role === 'ADMIN' || role === 'SUPERADMIN';
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers });
  }

  const snap = getEmailDeliveryConfigSnapshot();
  return NextResponse.json(
    {
      configured: snap.configured,
      resendApiKeyPresent: snap.resendApiKeyPresent,
      fromEmailPresent: snap.fromEmailPresent,
      fromEmailValid: snap.fromEmailValid,
      environment: snap.environment,
      senderPreview: snap.senderPreview,
      canAttemptSend: snap.canAttemptSend,
    },
    { headers },
  );
}
