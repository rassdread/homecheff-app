import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { clearAllUserData, validateAndCleanSession } from '@/lib/session-cleanup';

/**
 * Hook for managing session cleanup and data isolation
 */
export function useSessionCleanup() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Validate session on mount
    validateAndCleanSession();

    // Clean up on session change
    if (status === 'unauthenticated') {
      // User logged out, clear all data
      clearAllUserData();
    }
  }, [session, status]);

  // Clean up on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear sensitive data but keep cart for convenience
      if (typeof window !== 'undefined') {
        const sensitiveKeys = [
          'user_password',
          'user_token',
          'auth_token',
          'session_data',
          'temp_data'
        ];

        sensitiveKeys.forEach(key => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return {
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    session
  };
}
