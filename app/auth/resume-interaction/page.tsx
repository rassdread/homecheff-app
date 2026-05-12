'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  clearPendingIntent,
  getPendingIntent,
  isPendingIntentExpired,
} from '@/lib/onboarding/pending-intent';
import { trackOnboardingEvent } from '@/lib/onboarding/onboarding-analytics';

import { sanitizePostAuthRelativeUrl } from '@/lib/auth/post-auth-redirect';

function safeReturn(path: string | undefined | null, fallback: string): string {
  const s = sanitizePostAuthRelativeUrl(path || '');
  return s || fallback;
}

export default function ResumeInteractionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || !session?.user) {
      router.replace('/login?callbackUrl=/auth/resume-interaction');
      return;
    }
    if (ran.current) return;

    const intent = getPendingIntent();
    if (!intent || isPendingIntentExpired(intent)) {
      clearPendingIntent();
      router.replace('/');
      return;
    }
    if (!intent.autoResume) {
      const dest = safeReturn(intent.returnPath, '/');
      clearPendingIntent();
      router.replace(dest);
      return;
    }

    ran.current = true;

    void (async () => {
      const returnTo = safeReturn(intent.returnPath, '/');
      try {
        if (intent.type === 'save_item' || intent.type === 'like_item') {
          const productId = intent.targetId?.trim();
          if (!productId) throw new Error('missing_product');
          const res = await fetch('/api/favorites/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ productId }),
          });
          if (!res.ok) {
            const err = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(err.error || 'favorite_failed');
          }
          trackOnboardingEvent('PENDING_INTENT_RESUMED', { intent: intent.type });
        } else if (intent.type === 'follow_profile') {
          const sellerId = intent.targetId?.trim();
          if (!sellerId) throw new Error('missing_seller');
          const res = await fetch('/api/follows/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ sellerId }),
          });
          if (!res.ok) {
            const err = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(err.error || 'follow_failed');
          }
          trackOnboardingEvent('PENDING_INTENT_RESUMED', { intent: intent.type });
        } else if (intent.type === 'give_prop') {
          const productId = intent.targetId?.trim();
          const dishId = intent.draftKey?.trim();
          if (!productId && !dishId) throw new Error('missing_target');
          const res = await fetch('/api/props/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              ...(productId ? { productId } : {}),
              ...(dishId ? { dishId } : {}),
            }),
          });
          if (!res.ok) {
            const err = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(err.error || 'props_failed');
          }
          trackOnboardingEvent('PENDING_INTENT_RESUMED', { intent: intent.type });
        } else {
          clearPendingIntent();
          router.replace(returnTo);
          return;
        }

        clearPendingIntent();
        router.replace(returnTo);
      } catch {
        clearPendingIntent();
        setError('Kon je actie niet automatisch afronden. Ga terug en probeer nog eens.');
      }
    })();
  }, [router, session?.user, status]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <p className="text-slate-900 font-medium text-center max-w-md">{error}</p>
        <Link href="/" className="mt-6 text-emerald-700 font-semibold underline">
          Naar home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center px-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-600 border-t-transparent mx-auto mb-3" />
        <p className="text-slate-800 font-medium">Actie wordt hervat…</p>
      </div>
    </div>
  );
}
