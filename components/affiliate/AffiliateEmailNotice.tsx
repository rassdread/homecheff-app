'use client';

import Link from 'next/link';
import { buildVerifyEmailPath } from '@/lib/affiliate/signup-flow';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * Non-blocking. The dashboard itself must not ask for a code.
 * Email confirmation stays available for payouts and is labeled as such.
 */
export default function AffiliateEmailNotice({
  email,
  nextPath,
}: {
  email: string;
  nextPath: string;
}) {
  const { tOr } = useTranslation();
  return (
    <p
      role="status"
      className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      {tOr(
        'affiliate.emailNotice',
        'Your affiliate dashboard is open. Confirm your email when you want payouts. This is an email confirmation, not an affiliate code.',
        'Je affiliate-dashboard is open. Bevestig je e-mail als je uitbetalingen wilt. Dit is een e-mailbevestiging, geen affiliatecode.',
      )}{' '}
      <Link href={buildVerifyEmailPath(email, nextPath)} className="font-semibold underline">
        {tOr('affiliate.emailNoticeCta', 'Confirm email', 'E-mail bevestigen')}
      </Link>
    </p>
  );
}
