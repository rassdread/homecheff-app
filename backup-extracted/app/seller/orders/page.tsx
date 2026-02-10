'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect to the correct seller orders page
export default function SellerOrdersPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/verkoper/orders');
  }, [router]);
  
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-neutral-600">Doorverwijzen naar verkooporders...</p>
      </div>
    </div>
  );
}
