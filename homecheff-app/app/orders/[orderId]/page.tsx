'use client';

import { useParams } from 'next/navigation';
import OrderTracking from '@/components/orders/OrderTracking';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import BackButton from '@/components/navigation/BackButton';

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params?.orderId as string;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <BackButton 
            fallbackUrl="/orders"
            label="Terug naar bestellingen"
            variant="minimal"
          />
        </div>

        {/* Order Tracking Component */}
        <OrderTracking orderId={orderId} />
      </div>
    </div>
  );
}


