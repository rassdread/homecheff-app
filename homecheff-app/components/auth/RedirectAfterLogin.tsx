'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function RedirectAfterLogin() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (session?.user) {
      const user = session.user as any;
      
      // Redirect based on user role
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else if (user.role === 'SELLER') {
        router.push('/seller/profile');
      } else if (user.role === 'DELIVERY') {
        router.push('/delivery/dashboard');
      } else {
        // For BUYER or other roles, stay on homepage
        return;
      }
    }
  }, [session, status, router]);

  return null; // This component doesn't render anything
}
