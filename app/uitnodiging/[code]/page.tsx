import { redirect } from 'next/navigation';
import { getAffiliateIdFromCode } from '@/lib/affiliate-attribution';
import UitnodigingClient from './page-client';

export const dynamic = 'force-dynamic';

export default async function UitnodigingPage({
  params,
}: {
  params: { code: string };
}) {
  const code = params.code;

  if (!code) {
    redirect('/');
  }

  const affiliateId = await getAffiliateIdFromCode(code);

  return <UitnodigingClient code={code} isValid={!!affiliateId} />;
}

