import { Suspense } from 'react';
import SubAffiliateSignupClient from './page-client';

export const dynamic = 'force-dynamic';

export default async function SubAffiliateSignupPage({
  searchParams,
}: {
  searchParams?: { token?: string };
}) {
  const token = searchParams?.token;

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading...</div>
          </div>
        </div>
      }>
        <SubAffiliateSignupClient token={token} />
      </Suspense>
    </div>
  );
}







