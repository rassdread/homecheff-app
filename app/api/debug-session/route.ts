import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCorsHeaders } from '@/lib/apiCors';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint om te controleren of Safari de sessie-cookie meestuurt.
 * Open in Safari (ingelogd): https://homecheff.eu/api/debug-session
 * - hasSession: of getServerSession() een sessie vindt
 * - cookiePresent: of er een next-auth session cookie in de request zit
 * Verwijder of beveilig deze route in productie als je geen debug wilt.
 */
export async function GET(req: NextRequest) {
  const cors = getCorsHeaders(req);
  const cookieHeader = req.headers.get('cookie') || '';
  const cookieNames = cookieHeader.split(';').map((c) => c.trim().split('=')[0]).filter(Boolean);
  const sessionCookiePresent =
    cookieNames.some(
      (n) => n === 'next-auth.session-token' || n.startsWith('__Host-next-auth.session-token')
    );
  const session = await auth();
  const nextAuthUrlSet = !!process.env.NEXTAUTH_URL;
  const nextAuthUrlMatch =
    process.env.NEXTAUTH_URL === 'https://homecheff.eu'
      ? 'correct (homecheff.eu)'
      : process.env.NEXTAUTH_URL
        ? 'gezet maar niet https://homecheff.eu'
        : 'niet gezet (Vercel: NEXTAUTH_URL=https://homecheff.eu)';

  const body = {
    hasSession: !!session?.user,
    cookiePresent: sessionCookiePresent,
    cookieNames: cookieNames.filter((n) => n.includes('next-auth') || n.includes('session')),
    NEXTAUTH_URL: nextAuthUrlSet ? nextAuthUrlMatch : 'niet gezet',
    hint: sessionCookiePresent && !session?.user
      ? 'Cookie wordt meegestuurd maar sessie is ongeldig of verlopen.'
      : !sessionCookiePresent && !session?.user
        ? 'Geen sessie-cookie in request (Safari stuurt cookie niet mee?).'
        : session?.user
          ? 'Sessie OK.'
          : 'Onbekend',
  };
  return NextResponse.json(body, { headers: cors });
}
