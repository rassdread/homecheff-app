import { Suspense } from 'react';
import SocialLoginSuccess from '@/components/auth/SocialLoginSuccess';

export default function SocialLoginSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    }>
      <SocialLoginSuccess />
    </Suspense>
  );
}
