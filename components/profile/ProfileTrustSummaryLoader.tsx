'use client';

import { useEffect, useState } from 'react';
import ProfileTrustSummaryBlock from '@/components/profile/ProfileTrustSummaryBlock';
import type { ProfileTrustSummary } from '@/lib/trust/profile-trust-summary';

export default function ProfileTrustSummaryLoader({ userId }: { userId: string }) {
  const [summary, setSummary] = useState<ProfileTrustSummary | null>(null);

  useEffect(() => {
    void fetch(`/api/user/${userId}/trust-summary`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setSummary(data as ProfileTrustSummary);
      })
      .catch(() => undefined);
  }, [userId]);

  if (!summary) return null;
  return <ProfileTrustSummaryBlock summary={summary} />;
}
