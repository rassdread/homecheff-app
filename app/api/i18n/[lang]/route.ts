import { readFileSync } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { getCorsHeaders } from '@/lib/apiCors';

export const dynamic = 'force-dynamic';

/** Serve i18n JSON (nl/en) with CORS so Safari/lokaal IP kan vertalingen laden; gekoppeld aan taalwisselaar en homecheff-language cookie. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lang: string }> }
) {
  const cors = getCorsHeaders(req);
  const { lang } = await params;
  if (!lang || !/^[a-z]{2}(-[a-z0-9]+)*$/.test(lang)) {
    return NextResponse.json({ error: 'Invalid lang' }, { status: 400, headers: cors });
  }
  try {
    const filePath = path.join(process.cwd(), 'public', 'i18n', `${lang}.json`);
    const data = readFileSync(filePath, 'utf-8');
    const json = JSON.parse(data);
    return NextResponse.json(json, {
      headers: {
        ...cors,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: cors });
  }
}
