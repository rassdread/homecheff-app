import { NextResponse } from 'next/server';
import { loadPublicPresentation } from '@/lib/affiliate/program-store';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const country = new URL(req.url).searchParams.get('country') || 'NL';
  const presentation = await loadPublicPresentation(country.toUpperCase());
  return NextResponse.json(presentation);
}
