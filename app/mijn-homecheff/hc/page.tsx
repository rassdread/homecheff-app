import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { MijnHomecheffHcWalletClient } from '@/components/hc/MijnHomecheffHcWalletClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MijnHomeCheffHcPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/login?callbackUrl=%2Fmijn-homecheff%2Fhc');
  }

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/mijn-homecheff" className="text-sm text-stone-600 hover:text-stone-900">
          ← Mijn HomeCheff
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-stone-900">HC-saldo</h1>
        <p className="mt-1 text-sm text-stone-600">
          Je centrale HC-tegoed geldt op HomeCheff, Studio en Growth.
        </p>
        <div className="mt-6">
          <MijnHomecheffHcWalletClient />
        </div>
      </div>
    </div>
  );
}
