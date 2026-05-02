import { redirect } from 'next/navigation';
import { getAffiliateIdFromCode } from '@/lib/affiliate-attribution';
import WelkomClient from './page-client';

export const dynamic = 'force-dynamic';

export default async function WelkomPage({
  params,
}: {
  params: { code: string };
}) {
  const code = params.code;

  if (!code) {
    redirect('/');
  }

  // Validate referral code (cookie zetten gebeurt in de client — cookies().set in RSC geeft in Next 14+ een fout)
  const affiliateId = await getAffiliateIdFromCode(code);

  return <WelkomClient code={code} isValid={!!affiliateId} language="nl" />;
}

