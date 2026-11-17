'use client';

import { useEffect, useState } from 'react';
import { checkoutCourierMatchPath } from '@/lib/checkout/matched-courier-quote';

export interface DeliveryAvailability {
  isAvailable: boolean;
  estimatedTime: number;
  deliveryFee: number;
  availableCount?: number;
  message?: string;
}

export type CheckoutMatchedDeliverer = {
  id: string;
  quotedFeeCents?: number | null;
  calculatedDeliveryPrice?: number | null;
  withinFreeRadius?: boolean | null;
  routeDistanceKm?: number | null;
  distanceToBuyer?: number | null;
  totalDeliveryDistance?: number | null;
  [key: string]: unknown;
};

/**
 * Checkout availability comes from the existing product match.
 * The server resolves the pickup. The browser does not send seller coordinates.
 */
export function useDeliveryAvailability(
  buyer: { lat: number; lng: number } | null,
  productId: string | null,
) {
  const [availability, setAvailability] = useState<DeliveryAvailability>({
    isAvailable: false,
    estimatedTime: 0,
    deliveryFee: 0,
    availableCount: 0,
    message: 'Locatie niet beschikbaar',
  });
  const [deliverers, setDeliverers] = useState<CheckoutMatchedDeliverer[]>([]);
  const [weightRejections, setWeightRejections] = useState<Array<{ id: string; name: string; reason: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [settledKey, setSettledKey] = useState<string | null>(null);
  const requestKey =
    buyer && productId ? `${productId}:${buyer.lat}:${buyer.lng}` : null;

  useEffect(() => {
    if (!buyer || !productId) {
      setSettledKey(null);
      setDeliverers([]);
      setWeightRejections([]);
      setAvailability({
        isAvailable: false,
        estimatedTime: 0,
        deliveryFee: 0,
        availableCount: 0,
        message: buyer ? 'Product niet beschikbaar' : 'Locatie niet beschikbaar',
      });
      return;
    }

    const controller = new AbortController();
    const key = `${productId}:${buyer.lat}:${buyer.lng}`;
    const load = async () => {
      setLoading(true);
      setDeliverers([]);
      setWeightRejections([]);
      try {
        const response = await fetch(checkoutCourierMatchPath(productId, buyer), {
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok || data?.success !== true) {
        setDeliverers([]);
        setWeightRejections([]);
        setAvailability({
          isAvailable: false,
          estimatedTime: 0,
          deliveryFee: 0,
          availableCount: 0,
          message: 'Geen bezorgers beschikbaar in jouw regio op dit moment',
        });
          return;
        }
        const matched = Array.isArray(data.matchedDeliverers) ? data.matchedDeliverers : [];
        setDeliverers(matched);
        setWeightRejections(Array.isArray(data.weightRejections) ? data.weightRejections : []);
        setAvailability({
          isAvailable: matched.length > 0,
          estimatedTime: 0,
          deliveryFee: 0,
          availableCount: matched.length,
          message:
            matched.length > 0
              ? `${matched.length} bezorger${matched.length === 1 ? '' : 's'} beschikbaar`
              : 'Geen bezorgers beschikbaar in jouw regio op dit moment',
        });
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') return;
        setDeliverers([]);
        setWeightRejections([]);
        setAvailability({
          isAvailable: false,
          estimatedTime: 0,
          deliveryFee: 0,
          availableCount: 0,
          message: 'Fout bij controleren beschikbaarheid',
        });
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setSettledKey(key);
        }
      }
    };

    void load();
    return () => controller.abort();
  }, [buyer?.lat, buyer?.lng, productId]);

  return {
    availability,
    deliverers,
    weightRejections,
    loading,
    matchSettled: requestKey !== null && settledKey === requestKey,
  };
}
