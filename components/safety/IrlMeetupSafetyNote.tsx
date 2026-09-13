'use client';

import { irlMeetupSafetyCopy } from '@/lib/safety/irl-meetup-safety-copy';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * Soft contextual note for barter / direct-contact listing flows.
 * Not a modal and not age verification.
 */
export default function IrlMeetupSafetyNote({
  visible,
}: {
  visible: boolean;
}) {
  const { language } = useTranslation();
  if (!visible) return null;
  const copy = irlMeetupSafetyCopy(language === 'en' ? 'en' : 'nl');
  return (
    <div
      className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
      data-hc-irl-meetup-safety=""
      role="note"
    >
      <p className="font-medium">{copy.title}</p>
      <p className="mt-0.5 text-amber-900/90">{copy.body}</p>
    </div>
  );
}
