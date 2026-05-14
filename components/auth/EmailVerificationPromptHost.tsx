'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import EmailVerificationModal from '@/components/auth/EmailVerificationModal';
import {
  HC_EMAIL_VERIFICATION_REQUIRED_EVENT,
  type EmailVerificationRequiredDetail,
} from '@/lib/onboarding/email-verification-prompt-events';
import {
  HC_PENDING_EMAIL_VERIFICATION_STORAGE_KEY,
  type PendingEmailVerificationPayload,
} from '@/lib/email-verification-prompt-storage';
import { safeSessionStorageGetItem, safeSessionStorageRemoveItem } from '@/lib/browser-utils';
import { consumeAndResolvePostAuthUrl } from '@/lib/onboarding/pending-intent';

type OpenKind = 'soft' | 'required' | null;

/**
 * Global e-mail verification prompts: soft after registration (sessionStorage),
 * required when a protected action needs a verified address (custom event).
 */
export default function EmailVerificationPromptHost() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [openKind, setOpenKind] = useState<OpenKind>(null);
  const [email, setEmail] = useState('');
  const [initialSendOk, setInitialSendOk] = useState(true);
  const [providerUnavailable, setProviderUnavailable] = useState(false);
  const [requiredReason, setRequiredReason] =
    useState<EmailVerificationRequiredDetail['reason']>('generic');
  const softOpenedRef = useRef(false);

  const clearPendingStorage = useCallback(() => {
    safeSessionStorageRemoveItem(HC_PENDING_EMAIL_VERIFICATION_STORAGE_KEY);
  }, []);

  const closeSoft = useCallback(() => {
    setOpenKind(null);
    clearPendingStorage();
    softOpenedRef.current = false;
  }, [clearPendingStorage]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (status !== 'authenticated' || !session?.user?.email) return;
    if (softOpenedRef.current || openKind === 'required') return;

    const u = session.user as { emailVerified?: string | Date | null };
    if (u.emailVerified) return;

    const raw = safeSessionStorageGetItem(HC_PENDING_EMAIL_VERIFICATION_STORAGE_KEY);
    if (!raw) return;

    let parsed: PendingEmailVerificationPayload | null = null;
    try {
      parsed = JSON.parse(raw) as PendingEmailVerificationPayload;
    } catch {
      clearPendingStorage();
      return;
    }

    if (!parsed || parsed.v !== 1 || !parsed.email) {
      clearPendingStorage();
      return;
    }

    const sessionEmail = session.user.email.trim().toLowerCase();
    if (sessionEmail !== parsed.email.trim().toLowerCase()) {
      clearPendingStorage();
      return;
    }

    softOpenedRef.current = true;
    setEmail(parsed.email);
    setInitialSendOk(parsed.initialSendOk);
    setProviderUnavailable(parsed.providerUnavailable);
    setOpenKind('soft');
  }, [status, session?.user, clearPendingStorage]);

  useEffect(() => {
    const u = session?.user as { emailVerified?: string | Date | null } | undefined;
    if (u?.emailVerified && openKind) {
      setOpenKind(null);
      clearPendingStorage();
    }
  }, [session?.user, openKind, clearPendingStorage]);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<EmailVerificationRequiredDetail>;
      const d = ce.detail;
      if (!d?.email) return;
      const u = session?.user as { emailVerified?: string | Date | null } | undefined;
      if (u?.emailVerified) return;
      setEmail(d.email);
      setRequiredReason(d.reason || 'generic');
      setInitialSendOk(d.initialSendOk !== false);
      setProviderUnavailable(Boolean(d.providerUnavailable));
      setOpenKind('required');
    };
    window.addEventListener(HC_EMAIL_VERIFICATION_REQUIRED_EVENT, handler as EventListener);
    return () =>
      window.removeEventListener(HC_EMAIL_VERIFICATION_REQUIRED_EVENT, handler as EventListener);
  }, [session?.user]);

  if (!openKind || !email) return null;

  if (openKind === 'soft') {
    return (
      <EmailVerificationModal
        isOpen
        email={email}
        mode="soft"
        initialSendOk={initialSendOk}
        providerUnavailable={providerUnavailable}
        onVerified={closeSoft}
        onLater={() => {
          closeSoft();
          const u = session?.user as
            | { username?: string | null; socialOnboardingCompleted?: boolean | null }
            | undefined;
          const next = (u && consumeAndResolvePostAuthUrl(u)) || '/';
          router.replace(next);
        }}
        onClose={closeSoft}
      />
    );
  }

  return (
    <EmailVerificationModal
      isOpen
      email={email}
      mode="required"
      requiredReason={requiredReason}
      initialSendOk={initialSendOk}
      providerUnavailable={providerUnavailable}
      onVerified={async () => {
        try {
          await update();
        } catch {
          /* ignore */
        }
        setOpenKind(null);
        router.refresh();
      }}
      onNavigateBack={() => {
        setOpenKind(null);
        if (typeof window !== 'undefined' && window.history.length > 1) {
          router.back();
        } else {
          router.replace('/');
        }
      }}
    />
  );
}
