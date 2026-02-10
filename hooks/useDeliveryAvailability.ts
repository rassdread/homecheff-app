'use client';

import { useState, useEffect, useMemo } from 'react';

export interface DeliveryAvailability {
  isAvailable: boolean;
  estimatedTime: number;
  deliveryFee: number;
  availableCount?: number;
  message?: string;
}

export function useDeliveryAvailability(
  userLocation: { lat: number; lng: number } | null,
  sellerLocations?: Array<{lat: number; lng: number; productId: string}>
) {
  const [availability, setAvailability] = useState<DeliveryAvailability>({
    isAvailable: false,
    estimatedTime: 0,
    deliveryFee: 0,
    availableCount: 0,
    message: 'Locatie niet beschikbaar'
  });
  const [loading, setLoading] = useState(false);

  const sellerLocationsKey = useMemo(() => {
    if (!sellerLocations || sellerLocations.length === 0) {
      return '[]';
    }
    const normalized = sellerLocations
      .map((location) => ({
        lat: Number(location.lat?.toFixed(5) ?? 0),
        lng: Number(location.lng?.toFixed(5) ?? 0),
        productId: location.productId,
      }))
      .sort((a, b) => (a.productId > b.productId ? 1 : a.productId < b.productId ? -1 : 0));
    return JSON.stringify(normalized);
  }, [sellerLocations]);

  useEffect(() => {
    if (!userLocation) {
      setAvailability({
        isAvailable: false,
        estimatedTime: 0,
        deliveryFee: 0,
        availableCount: 0,
        message: 'Locatie niet beschikbaar'
      });
      return;
    }

    const checkAvailability = async () => {
      setLoading(true);
      try {
        // If we have seller locations, check availability for the closest seller
        // (bezorgers must be within range of BOTH seller and buyer)
        let sellerLat: number | null = null;
        let sellerLng: number | null = null;
        
        if (sellerLocations && sellerLocations.length > 0) {
          // Use first seller location (or could calculate closest one)
          // For multiple products, we check if any deliverer can reach both locations
          sellerLat = sellerLocations[0].lat;
          sellerLng = sellerLocations[0].lng;
        }

        const response = await fetch('/api/delivery/check-availability', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lat: userLocation.lat,
            lng: userLocation.lng,
            sellerLat: sellerLat,
            sellerLng: sellerLng
          })
        });

        if (response.ok) {
          const data = await response.json();
          setAvailability(data);
        } else {
          setAvailability({
            isAvailable: false,
            estimatedTime: 0,
            deliveryFee: 0,
            availableCount: 0,
            message: 'Bezorging niet beschikbaar in dit gebied'
          });
        }
      } catch (error) {
        console.error('Error checking delivery availability:', error);
        setAvailability({
          isAvailable: false,
          estimatedTime: 0,
          deliveryFee: 0,
          availableCount: 0,
          message: 'Fout bij controleren beschikbaarheid'
        });
      } finally {
        setLoading(false);
      }
    };

    checkAvailability();
  }, [userLocation?.lat, userLocation?.lng, sellerLocationsKey]);

  return { availability, loading };
}