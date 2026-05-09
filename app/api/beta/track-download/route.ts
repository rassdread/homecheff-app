import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** Ruwe click-tracking voor admin-inzicht (geen persoonsgegevens verplicht). */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as { refCode?: string }));
    const refCode =
      typeof body.refCode === 'string' && body.refCode.trim().length > 0
        ? body.refCode.trim().slice(0, 64)
        : null;
    const userAgent = req.headers.get('user-agent')?.slice(0, 512) ?? null;

    await prisma.betaDownloadEvent.create({
      data: {
        refCode,
        userAgent,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('beta track-download:', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
