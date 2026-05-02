import { redirect } from 'next/navigation';
import { getAffiliateIdFromCode } from '@/lib/affiliate-attribution';

export const dynamic = 'force-dynamic';

export default async function WelkomPageEN({
  params,
}: {
  params: { code: string };
}) {
  const code = params.code;

  if (!code) {
    redirect('/');
  }

  const affiliateId = await getAffiliateIdFromCode(code);
  if (!affiliateId) {
    redirect('/');
  }

  redirect(
    `/api/affiliate/referral?code=${encodeURIComponent(code)}&redirect=${encodeURIComponent('/')}`
  );
}
