import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import SocialLoginOnboarding from '@/components/auth/SocialLoginOnboarding';

export default async function SocialLoginSuccessPage() {
  // Server-side check if onboarding is needed
  const session = await getServerSession(authOptions);
  
  if (session?.user) {
    const needsOnboarding = (session.user as any).needsOnboarding;
    const tempUsername = (session.user as any).tempUsername;
    const username = (session.user as any).username;
    
    console.log('🔍 Server-side onboarding check:', { 
      needsOnboarding, 
      tempUsername,
      username,
      hasTempPrefix: username?.startsWith('temp_')
    });
    
    // If onboarding is already completed, redirect to home
    if (!needsOnboarding && !tempUsername && username && !username.startsWith('temp_')) {
      console.log('✅ Onboarding already completed (server-side), redirecting to home');
      redirect('/');
    }
  }
  
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    }>
      <SocialLoginOnboarding />
    </Suspense>
  );
}
