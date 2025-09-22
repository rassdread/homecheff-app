'use client';

import { useState, useEffect } from 'react';

export interface DeliveryAvailability {
  isAvailable: boolean;
  estimatedTime: number;
  deliveryFee: number;
  message?: string;
}

export function useDeliveryAvailability(userLocation: { lat: number; lng: number } | null) {
  const [availability, setAvailability] = useState<DeliveryAvailability>({
    isAvailable: false,
    estimatedTime: 0,
    deliveryFee: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userLocation) {
      setAvailability({
        isAvailable: false,
        estimatedTime: 0,
        deliveryFee: 0,
        message: 'Locatie niet beschikbaar'
      });
      return;
    }

    const checkAvailability = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/delivery/check-availability', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lat: userLocation.lat,
            lng: userLocation.lng
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
            message: 'Bezorging niet beschikbaar in dit gebied'
          });
        }
      } catch (error) {
        console.error('Error checking delivery availability:', error);
        setAvailability({
          isAvailable: false,
          estimatedTime: 0,
          deliveryFee: 0,
          message: 'Fout bij controleren beschikbaarheid'
        });
      } finally {
        setLoading(false);
      }
    };

    checkAvailability();
  }, [userLocation]);

  return { availability, loading };
}