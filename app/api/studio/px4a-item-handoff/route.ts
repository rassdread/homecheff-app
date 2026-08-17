import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  isItemHandoffTokenSizeOk,
  studioItemHandoffAction,
} from '@/lib/studio/px4a-item-handoff';
import {
  createItemHandoffPayload,
  signItemHandoffPayload,
  studioItemHandoffSecrets,
} from '@/lib/studio/px4a-item-handoff-hmac';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  const session = await auth();
  const centralUserId = (session?.user as { id?: string } | undefined)?.id?.trim() ?? '';
  if (!session?.user || !centralUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const secrets = studioItemHandoffSecrets();
  const secret = secrets[0];
  if (!secret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let photoUrls: unknown = [];
  try {
    const body = (await req.json()) as { photoUrls?: unknown };
    photoUrls = body.photoUrls;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const payload = createItemHandoffPayload({
    centralUserId,
    photoUrls: Array.isArray(photoUrls) ? photoUrls.map(String) : [],
  });
  if (!payload) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const token = signItemHandoffPayload(payload, secret);
  if (!isItemHandoffTokenSizeOk(token)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  return NextResponse.json({
    action: studioItemHandoffAction(),
    token,
  });
}
