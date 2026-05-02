import { redirect } from 'next/navigation';
import { getAffiliateIdFromCode } from '@/lib/affiliate-attribution';
import WelkomClient from './page-client';

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

  return <WelkomClient code={code} isValid={!!affiliateId} language="en" />;
}

