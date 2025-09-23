'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { clearNextAuthData, clearAllUserData } from '@/lib/session-cleanup';

/**
 * Component that guards against session data leakage
 * Automatically clears all user data when no valid session exists
 */
export default function SessionGuard() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // If we're not authenticated, clear all data
    if (status === 'unauthenticated') {
      console.log('SessionGuard: No valid session, clearing all user data');
      clearAllUserData();
      clearNextAuthData();
    }
  }, [status]);

  // This component doesn't render anything
  return null;
}
