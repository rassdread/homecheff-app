import { cookies } from 'next/headers';
import { NEW_ACCOUNT_COOKIE, NEW_ACCOUNT_COOKIE_VALUE } from '@/lib/meta/commerce';

/**
 * One-shot signal that THIS sign-in created a HomeCheff account.
 * The value is the flag "1". It is not a user id and it is not sent to Meta.
 * Auth must continue if the cookie cannot be set.
 */
export function markNewAccountForMeta(userId: string | undefined | null): void {
  try {
    const id = (userId ?? '').trim();
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(id)) return;
    cookies().set(NEW_ACCOUNT_COOKIE, NEW_ACCOUNT_COOKIE_VALUE, {
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
