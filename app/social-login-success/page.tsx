'use client';

import { useEffect } from 'react';

/**
 * Legacy URL na OAuth. Canonical flow: /auth/social-success
 */
export default function SocialLoginSuccessLegacyRedirect() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = window.location.search || '';
    window.location.replace(`/auth/social-success${q}`);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
        <p className="text-gray-600 text-sm">Doorverwijzen…</p>
      </div>
    </div>
  );
}
