import { cookies } from 'next/headers';
import { NEW_ACCOUNT_COOKIE, registrationEventId } from '@/lib/meta/commerce';

/**
 * One-shot signal that THIS sign-in created a HomeCheff account.
 * The value is a dedupe id (reg:{userId}), not a profile.
 * Auth must continue if the cookie cannot be set.
 */
export function markNewAccountForMeta(userId: string | undefined | null): void {
  try {
    const eventId = registrationEventId(userId);
    if (!eventId) return;
    cookies().set(NEW_ACCOUNT_COOKIE, eventId, {
      path: '/',
      maxAge: 180,
      sameSite: 'lax',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
    });
  } catch {
    /* never block authentication */
  }
}
