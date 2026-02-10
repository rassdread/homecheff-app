'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VerkoperPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard
    router.replace('/verkoper/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500">Doorverwijzen naar dashboard...</div>
    </div>
  );
}