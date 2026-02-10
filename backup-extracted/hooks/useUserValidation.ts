'use client';

import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function useUserValidation() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const validateUser = async () => {
      if (status === 'loading') return; // Still loading
      if (status === 'unauthenticated') return; // Not logged in

      if (session?.user?.email) {
        try {
          const response = await fetch('/api/profile/me');
          
          if (response.status === 404) {
            // User no longer exists, sign out
            await signOut({ 
              callbackUrl: '/',
              redirect: true 
            });
            return;
          }
          
          if (!response.ok) {
            // Other error, but don't sign out immediately
            console.warn('Failed to validate user:', response.status);
          }
        } catch (error) {
          console.error('Error validating user:', error);
          // Don't sign out on network errors
        }
      }
    };

    // Validate user every 30 seconds when logged in
    const interval = setInterval(validateUser, 30000);
    
    // Also validate immediately
    validateUser();

    return () => clearInterval(interval);
  }, [session, status, router]);
}
