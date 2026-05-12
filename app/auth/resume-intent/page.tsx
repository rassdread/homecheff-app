'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  clearPendingIntent,
  getPendingIntent,
  isPendingIntentExpired,
} from '@/lib/onboarding/pending-intent';
import {
  needsProfileOnboardingFromFlags,
  onboardingFlagsFromSessionUser,
} from '@/lib/auth/post-auth-redirect';

export default function ResumeIntentPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (ran.current) return;
    if (status !== 'authenticated' || !session?.user) {
      router.replace('/login?callbackUrl=/auth/resume-intent');
      return;
    }
    const u = session.user as {
      username?: string | null;
      socialOnboardingCompleted?: boolean | null;
    };
    if (needsProfileOnboardingFromFlags(onboardingFlagsFromSessionUser(u))) {
      router.replace('/onboarding/complete-profile');
      return;
    }

    const intent = getPendingIntent();
    if (!intent || isPendingIntentExpired(intent)) {
      clearPendingIntent();
      router.replace('/');
      return;
    }

    if (intent.type !== 'start_chat') {
      clearPendingIntent();
      router.replace('/');
      return;
    }

    ran.current = true;

    void (async () => {
      try {
        const productId = intent.draftKey?.trim();
        const sellerId = intent.targetId?.trim();
        const endpoint = productId ? '/api/conversations/start' : '/api/conversations/start-seller';
        const body = productId
          ? { productId, initialMessage: null as string | null }
          : { sellerId: sellerId || '', initialMessage: null as string | null };

        if (!productId && !sellerId) {
          clearPendingIntent();
          router.replace(intent.returnPath && intent.returnPath.startsWith('/') ? intent.returnPath : '/');
          return;
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          setError(err?.error || 'Kon geen gesprek starten.');
          clearPendingIntent();
          return;
        }

        const data = (await res.json()) as { conversation?: { id: string } };
        const id = data.conversation?.id;
        clearPendingIntent();
        if (id) {
          router.replace(`/messages?conversation=${encodeURIComponent(id)}`);
        } else {
          router.replace('/messages');
        }
      } catch {
        setError('Er ging iets mis. Probeer het opnieuw vanaf de productpagina.');
        clearPendingIntent();
      }
    })();
  }, [router, session?.user, status]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <p className="text-gray-900 font-medium text-center max-w-md">{error}</p>
        <Link href="/messages" className="mt-6 text-emerald-700 font-semibold underline">
          Naar berichten
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-600 border-t-transparent mx-auto mb-3" />
        <p className="text-gray-800 font-medium">Gesprek wordt geopend…</p>
      </div>
    </div>
  );
}
