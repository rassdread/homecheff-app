import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import InviteNeighbourPanel from '@/components/referral/InviteNeighbourPanel';
import { PERSONAL_INVITE_PATH } from '@/lib/affiliates/personal-referral';

export const dynamic = 'force-dynamic';

export default async function InvitePageEn() {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent('/en/invite')}`);
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      <InviteNeighbourPanel />
    </div>
  );
}
