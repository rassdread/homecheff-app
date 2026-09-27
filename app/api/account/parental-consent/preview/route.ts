import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateAgeFromDob } from '@/lib/delivery/delivery-age';
import { lookupParentalConsentToken } from '@/lib/age/parental-consent';

export const dynamic = 'force-dynamic';

function displayName(name: string | null | undefined): string | null {
  const raw = name?.trim() ?? '';
  if (!raw || raw.includes('@')) return null;
  return raw;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const revokeToken = typeof body.revokeToken === 'string' ? body.revokeToken.trim() : '';
  const lookup = await lookupParentalConsentToken(prisma, {
    token: token || null,
    revokeToken: revokeToken || null,
  });
  if (!lookup.ok) {
    const message =
      lookup.reason === 'EXPIRED'
        ? 'Deze link is verlopen. Vraag een nieuwe aan via het HomeCheff-account.'
        : lookup.reason === 'USED'
          ? 'Deze link is al gebruikt.'
          : 'Deze link is ongeldig.';
    const messageEn =
      lookup.reason === 'EXPIRED'
        ? 'This link has expired. Ask for a new one from the HomeCheff account.'
        : lookup.reason === 'USED'
          ? 'This link has already been used.'
          : 'This link is invalid.';
    return NextResponse.json({ error: lookup.reason, message, messageEn }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: lookup.userId },
    select: { name: true, username: true, dateOfBirth: true },
  });
  const age = calculateAgeFromDob(user?.dateOfBirth ?? null);
  return NextResponse.json({
    ok: true,
    purpose: lookup.purpose,
    minorName: displayName(user?.name),
    username: user?.username ?? null,
    ageYears: age.ok ? age.ageYears : null,
  });
}
