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
      (n) =>
        n === 'next-auth.session-token' ||
        n.startsWith('__Host-next-auth.session-token') ||
        n.startsWith('__Secure-next-auth.session-token')
    );
  const session = await auth();
  const nextAuthUrlSet = !!process.env.NEXTAUTH_URL;
  const nextAuthUrlMatch =
    process.env.NEXTAUTH_URL === 'https://homecheff.eu'
      ? 'correct (homecheff.eu)'
      : process.env.NEXTAUTH_URL
        ? 'gezet maar niet https://homecheff.eu'
        : 'niet gezet (Vercel: NEXTAUTH_URL=https://homecheff.eu)';
  const hasSecret = !!process.env.NEXTAUTH_SECRET;

  const body = {
    hasSession: !!session?.user,
    cookiePresent: sessionCookiePresent,
    origin: req.headers.get('origin') ?? '(missing)',
    cookieNames: cookieNames.filter((n) => n.includes('next-auth') || n.includes('session')),
    NEXTAUTH_URL: nextAuthUrlSet ? nextAuthUrlMatch : 'niet gezet',
    NEXTAUTH_SECRET: hasSecret ? 'gezet' : 'niet gezet (Vercel: verplicht voor JWT)',
    hint: sessionCookiePresent && !session?.user
      ? (hasSecret
          ? 'Cookie wordt meegestuurd maar sessie ongeldig/verlopen – log uit en opnieuw in voor nieuwe cookie.'
          : 'NEXTAUTH_SECRET ontbreekt in Vercel – zet in Env Vars, daarna opnieuw inloggen.')
      : !sessionCookiePresent && !session?.user
        ? 'Geen sessie-cookie in request (Safari stuurt cookie niet mee?).'
        : session?.user
          ? 'Sessie OK.'
          : 'Onbekend',
  };
  return NextResponse.json(body, { headers: cors });
}
