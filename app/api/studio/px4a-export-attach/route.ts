import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  PX4A_EXPORT_VIDEO_STORAGE_KEY,
  isExportAttachTokenSizeOk,
} from '@/lib/studio/px4a-export-attach';
import { studioItemHandoffSecrets, verifyExportAttachToken } from '@/lib/studio/px4a-export-attach-hmac';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  const session = await auth();
  const centralUserId = (session?.user as { id?: string } | undefined)?.id?.trim() ?? '';
  if (!session?.user || !centralUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const secrets = studioItemHandoffSecrets();
  if (secrets.length === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const form = await req.formData().catch(() => null);
  const token = String(form?.get('token') ?? '').trim();
  if (!isExportAttachTokenSizeOk(token)) {
    return NextResponse.json({ error: 'Invalid handoff' }, { status: 400 });
  }
  const payload = verifyExportAttachToken(token, secrets);
  if (!payload || payload.u !== centralUserId) {
    return NextResponse.json({ error: 'Invalid handoff' }, { status: 400 });
  }
  const pending = JSON.stringify({
    v: 1,
    url: payload.videoUrl,
    duration: payload.duration,
    thumb: payload.thumb,
  });
  const html = `<!doctype html><meta charset="utf-8"><title>HomeCheff</title><script>
try{sessionStorage.setItem(${JSON.stringify(PX4A_EXPORT_VIDEO_STORAGE_KEY)},${JSON.stringify(pending)});}catch(e){}
location.replace("/sell/new?px4a=1&px4aResult=ready");
</script>`;
  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
