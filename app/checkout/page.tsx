'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useCart } from '@/hooks/useCart';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { MapPin, Clock, Package, Truck, Users, CreditCard, CheckCircle, Navigation, AlertCircle, Loader2, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import TeenDeliveryInfo from '@/components/delivery/TeenDeliveryInfo';
import { getCurrentLocation } from '@/lib/geolocation';
import { useDeliveryAvailability } from '@/hooks/useDeliveryAvailability';
import { usePersistentState } from '@/hooks/usePersistentState';
import { getActiveCartIdentifier } from '@/lib/cart';
import { calculateStripeFeeForBuyer } from '@/lib/fees';
import { useTranslation } from '@/hooks/useTranslation';
import DynamicAddressFields, { AddressData } from '@/components/ui/DynamicAddressFields';

type DeliveryOption = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  price: number;
  estimatedTime: string;
  available: boolean;
};

type CheckoutDraft = {
  selectedDelivery: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
  deliveryDate: string;
  deliveryTime: string;
  notes: string;
  coordinates: { lat: number; lng: number } | null;
  addressValidated: boolean;
  enableSmsNotification: boolean; // SMS notificatie optie voor verkopers
};

export default function CheckoutPage() {
  const { t } = useTranslation();
  const { items: cartItems, clearCart } = useCart();
  const { data: session, status } = useSession();
  const cartIdentifier = getActiveCartIdentifier();
  const checkoutStorageKey = `homecheff_checkout_draft_${cartIdentifier}`;

  const checkoutDraftDefaults = useMemo<CheckoutDraft>(() => ({
    selectedDelivery: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    country: 'NL',
    deliveryDate: '',
    deliveryTime: '',
    notes: '',
    coordinates: null,
    addressValidated: false,
    enableSmsNotification: false, // Default: geen SMS
  }), []);

  const [checkoutDraft, setCheckoutDraft, { reset: resetCheckoutDraft, isHydrated: isCheckoutHydrated }] =
    usePersistentState<CheckoutDraft>(checkoutStorageKey, checkoutDraftDefaults, {
      storage: 'session',
      ttl: 12 * 60 * 60 * 1000, // 12 uur
    });

  const updateDraft = useCallback(
    (updates: Partial<CheckoutDraft>) => {
      setCheckoutDraft((prev) => ({ ...prev, ...updates }));
    },
    [setCheckoutDraft]
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const hasPrefilledAddressRef = useRef(false);
  
  // Real-time delivery fee calculation
  const [actualDeliveryFee, setActualDeliveryFee] = useState<{
    deliveryFeeCents: number;
    distance: number;
    isInternational: boolean;
    breakdown: any;
  } | null>(null);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);

  // Get product locations from cart for delivery matching
  const [sellerLocations, setSellerLocations] = useState<Array<{lat: number, lng: number, productId: string}>>([]);
  const [productDataMap, setProductDataMap] = useState<Map<string, {sellerCanDeliver?: boolean}>>(new Map());
  
  // Fetch product locations when cart items change
  useEffect(() => {
    const fetchProductLocations = async () => {
      if (cartItems.length === 0) {
        setSellerLocations([]);
        setProductDataMap(new Map());
        return;
      }

      try {
        const productIds = cartItems.map(item => item.productId);
        const locations: Array<{lat: number, lng: number, productId: string}> = [];
        const productMap = new Map<string, {sellerCanDeliver?: boolean}>();
        
        for (const productId of productIds) {
          const response = await fetch(`/api/products/${productId}`);
          if (response.ok) {
            const data = await response.json();
            const product = data.product || data;
            // Seller location can be in product.seller.User.lat/lng or product.seller.lat/lng
            const sellerLat = product.seller?.User?.lat || product.seller?.lat;
            const sellerLng = product.seller?.User?.lng || product.seller?.lng;
            
            // Store product data for sellerCanDeliver check
            productMap.set(productId, {
              sellerCanDeliver: product.sellerCanDeliver || false
            });
            
            if (sellerLat && sellerLng) {
              locations.push({
                lat: sellerLat,
                lng: sellerLng,
                productId: productId
              });
            }
          }
        }
        
        setSellerLocations(locations);
        setProductDataMap(productMap);
      } catch (error) {
        console.error('Error fetching product locations:', error);
      }
    };
    
    fetchProductLocations();
  }, [cartItems]);

  useEffect(() => {
    if (!isCheckoutHydrated) {
      return;
    }

    if (cartItems.length === 0) {
      resetCheckoutDraft();
    }
  }, [cartItems.length, isCheckoutHydrated, resetCheckoutDraft]);

  const hasExistingAddressDraft = useMemo(() => {
    return Boolean(
      checkoutDraft.street ||
      checkoutDraft.houseNumber ||
      checkoutDraft.postalCode ||
      checkoutDraft.city ||
      checkoutDraft.country !== 'NL'
    );
  }, [checkoutDraft.street, checkoutDraft.houseNumber, checkoutDraft.postalCode, checkoutDraft.city, checkoutDraft.country]);

  useEffect(() => {
    if (!isCheckoutHydrated || !session || hasPrefilledAddressRef.current || hasExistingAddressDraft) {
      return;
    }

    let aborted = false;
    const controller = new AbortController();

    const prefillFromProfile = async () => {
      try {
        const response = await fetch('/api/profile/me', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        const user = data?.user;
        if (!user || aborted) {
          return;
        }

        const updates: Partial<CheckoutDraft> = {};

        const splitAddress = (value: string | null | undefined) => {
          if (!value) {
            return { street: undefined, house: undefined };
          }
          const trimmed = value.trim();
          const match = trimmed.match(/^(.+?)\s+(\d+[a-zA-Z0-9\-]*)$/);
          if (match) {
            return { street: match[1], house: match[2] };
          }
          return { street: trimmed, house: undefined };
        };

        const { street, house } = splitAddress(user.address);
        if (street) {
          updates.street = street;
        }
        if (house) {
          updates.houseNumber = house;
        }
        if (user.postalCode) {
          updates.postalCode = user.postalCode.replace(/\s+/g, '').toUpperCase();
        }
        if (user.city) {
          updates.city = user.city;
        }
        if (user.country) {
          updates.country = user.country;
        }
        if (user.lat && user.lng) {
          updates.coordinates = { lat: user.lat, lng: user.lng };
          updates.addressValidated = true;
        }

        if (Object.keys(updates).length > 0 && !aborted) {
          updateDraft(updates);
          hasPrefilledAddressRef.current = true;
        }
      } catch (error) {
        if ((error as any)?.name === 'AbortError') {
          return;
        }
        console.error('Failed to prefill checkout address from profile:', error);
      }
    };

    prefillFromProfile();

    return () => {
      aborted = true;
      controller.abort();
    };
  }, [isCheckoutHydrated, session, hasExistingAddressDraft, updateDraft]);

  // Check delivery availability with seller locations
  const { 
    availability,
    loading: availabilityLoading 
  } = useDeliveryAvailability(checkoutDraft.coordinates, sellerLocations);
  
  const isDeliveryAvailable = availability.isAvailable;
  const availableDeliverersCount = 0; // Will be updated when deliverers are available
  const estimatedDeliveryTime = availability.estimatedTime;

  // Get current location for delivery
  const getLocation = async () => {
    try {
      setLocationError(null);
      const coords = await getCurrentLocation();
      updateDraft({
        coordinates: coords,
        addressValidated: true,
      });
    } catch (error) {
      console.error('Location error:', error);
      setLocationError('Locatie kon niet worden opgehaald. Voer handmatig een adres in.');
    }
  };

  // Calculate real-time delivery/shipping fee when coordinates are available
  const calculateDeliveryFee = useCallback(async () => {
    if (!checkoutDraft.selectedDelivery) {
      setActualDeliveryFee(null);
      return;
    }
    
    const isDelivery = checkoutDraft.selectedDelivery === 'teen_delivery' || 
                       checkoutDraft.selectedDelivery === 'local_delivery';
    const isShipping = checkoutDraft.selectedDelivery === 'shipping';
    
    // For delivery: need coordinates
    if (isDelivery && !checkoutDraft.coordinates) {
      setActualDeliveryFee(null);
      return;
    }
    
    // For shipping: need address info
    if (isShipping && (!checkoutDraft.postalCode || !checkoutDraft.country)) {
      setActualDeliveryFee(null);
      return;
    }

    setIsCalculatingFee(true);
    try {
      if (isShipping) {
        // Calculate shipping price using EctaroShip
        // API will automatically get seller address from cart items
        const response = await fetch('/api/shipping/calculate-price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cartItems, // API will get seller address from products
            destination: {
              postalCode: checkoutDraft.postalCode,
              country: checkoutDraft.country || 'NL'
            }
            // weight and dimensions will be calculated from products
            // origin will be fetched from seller address
          })
        });

        if (response.ok) {
          const data = await response.json();
          setActualDeliveryFee({
            deliveryFeeCents: data.priceCents,
            distance: 0,
            isInternational: checkoutDraft.country !== 'NL',
            breakdown: {
              baseFee: 0,
              distanceFee: data.priceCents,
              totalDeliveryFee: data.priceCents,
              distance: 0
            }
          });
        } else {
          console.error('Failed to calculate shipping price');
          setActualDeliveryFee(null);
        }
      } else {
        // Calculate delivery fee (existing logic)
        const response = await fetch('/api/checkout/calculate-delivery-fee', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cartItems,
            coordinates: checkoutDraft.coordinates,
            deliveryMode: checkoutDraft.selectedDelivery,
            country: checkoutDraft.country || 'NL'
          })
        });

        if (response.ok) {
          const data = await response.json();
          setActualDeliveryFee(data);
        } else {
          console.error('Failed to calculate delivery fee');
          setActualDeliveryFee(null);
        }
      }
    } catch (error) {
      console.error('Error calculating fee:', error);
      setActualDeliveryFee(null);
    } finally {
      setIsCalculatingFee(false);
    }
  }, [checkoutDraft.coordinates, checkoutDraft.selectedDelivery, checkoutDraft.country, checkoutDraft.postalCode, cartItems]);

  // Recalculate fee when coordinates, delivery mode, or address changes
  useEffect(() => {
    if (!checkoutDraft.selectedDelivery) {
      setActualDeliveryFee(null);
      return;
    }
    
    const isShipping = checkoutDraft.selectedDelivery === 'shipping';
    const isDelivery = checkoutDraft.selectedDelivery === 'teen_delivery' || 
                       checkoutDraft.selectedDelivery === 'local_delivery';
    
    // For shipping: need postal code and country
    if (isShipping && checkoutDraft.postalCode && checkoutDraft.country) {
      calculateDeliveryFee();
    }
    // For delivery: need coordinates and validated address
    else if (isDelivery && checkoutDraft.coordinates && checkoutDraft.addressValidated) {
      calculateDeliveryFee();
    } else {
      setActualDeliveryFee(null);
    }
  }, [checkoutDraft.coordinates, checkoutDraft.selectedDelivery, checkoutDraft.addressValidated, checkoutDraft.postalCode, checkoutDraft.country, calculateDeliveryFee]);

  // Handle address change from DynamicAddressFields
  const handleAddressChange = useCallback((addressData: AddressData) => {
    // Google Places Autocomplete provides full address for all countries
    // Extract street and houseNumber from address if needed
    let street = addressData.address || '';
    let houseNumber = addressData.houseNumber || '';
    
    // Try to extract house number from address if not provided separately (for NL)
    if (addressData.country === 'NL' && !houseNumber && addressData.address) {
      const match = addressData.address.match(/^(.+?)\s+(\d+[a-zA-Z0-9\-]*)$/);
      if (match) {
        street = match[1];
        houseNumber = match[2];
      }
    }
    
    updateDraft({
      street,
      houseNumber,
      postalCode: addressData.postalCode || '',
      city: addressData.city || '',
      country: addressData.country || 'NL',
      coordinates: addressData.lat && addressData.lng ? { lat: addressData.lat, lng: addressData.lng } : null,
      addressValidated: !!(addressData.lat && addressData.lng),
    });
    setLocationError(null);
  }, [updateDraft]);
  
  const handleAddressGeocode = useCallback((addressData: AddressData) => {
    if (addressData.lat && addressData.lng) {
      updateDraft({
        coordinates: { lat: addressData.lat, lng: addressData.lng },
        addressValidated: true,
      });
      setLocationError(null);
    }
  }, [updateDraft]);

  // Helper function to parse deliveryMode (can be comma-separated or single value)
  const parseDeliveryMode = (deliveryMode: string | undefined): string[] => {
    if (!deliveryMode) return ['PICKUP'];
    if (deliveryMode === 'BOTH') return ['PICKUP', 'DELIVERY'];
    if (deliveryMode.includes(',')) {
      return deliveryMode.split(',').map(m => m.trim().toUpperCase());
    }
    return [deliveryMode.toUpperCase()];
  };

  // Determine available delivery modes based on cart items
  const availableDeliveryModes = useMemo(() => {
    const allModes = new Set<string>();
    
    cartItems.forEach(item => {
      const deliveryMode = item.deliveryMode || 'PICKUP';
      const parsedModes = parseDeliveryMode(deliveryMode);
      parsedModes.forEach(mode => allModes.add(mode));
    });
    
    // Determine which options should be available
    const hasPickup = Array.from(allModes).some(mode => mode === 'PICKUP');
    const hasDelivery = Array.from(allModes).some(mode => mode === 'DELIVERY');
    const hasShipping = Array.from(allModes).some(mode => mode === 'SHIPPING');
    
    // For delivery: check if products support delivery AND if at least one product has sellerCanDeliver === true
    const hasSellerDelivery = cartItems.some(item => {
      const productData = productDataMap.get(item.productId);
      return productData?.sellerCanDeliver === true;
    });
    
    return { hasPickup, hasDelivery, hasSellerDelivery, hasShipping };
  }, [cartItems, productDataMap]);

  const deliveryOptions: DeliveryOption[] = [
    {
      id: 'pickup',
      name: t('checkout.pickup'),
      description: t('checkout.pickupDescription'),
      icon: <Package className="w-6 h-6" />,
      price: 0,
      estimatedTime: t('checkout.pickupEstimatedTime'),
      available: availableDeliveryModes.hasPickup
    },
    {
      id: 'local_delivery',
      name: t('checkout.localDelivery'),
      description: t('checkout.localDeliveryDescription'),
      icon: <Truck className="w-6 h-6" />,
      price: 3,
      estimatedTime: t('checkout.localDeliveryEstimatedTime'),
      available: availableDeliveryModes.hasDelivery && availableDeliveryModes.hasSellerDelivery
    },
    {
      id: 'teen_delivery',
      name: t('checkout.teenDelivery'),
      description: t('checkout.teenDeliveryDescription'),
      icon: <Users className="w-6 h-6" />,
      price: 2,
      estimatedTime: estimatedDeliveryTime ? `${estimatedDeliveryTime} min` : t('checkout.teenDeliveryEstimatedTime'),
      available: availableDeliveryModes.hasDelivery
    },
    {
      id: 'shipping',
      name: t('checkout.shipping'),
      description: t('checkout.shippingDescription') || t('checkout.dhlPostnl'),
      icon: <Truck className="w-6 h-6" />,
      price: actualDeliveryFee?.deliveryFeeCents ? actualDeliveryFee.deliveryFeeCents / 100 : 8, // Use calculated price or default
      estimatedTime: t('checkout.shippingEstimatedTime') || '1-3 werkdagen',
      available: availableDeliveryModes.hasShipping // Only available if at least one product supports shipping
    }
  ];

  const availableOptions = deliveryOptions.filter(option => option.available);
  const selectedOption = deliveryOptions.find(option => option.id === checkoutDraft.selectedDelivery);
  
  // Reset selected delivery if it's no longer available
  useEffect(() => {
    if (checkoutDraft.selectedDelivery && selectedOption && !selectedOption.available) {
      updateDraft({ selectedDelivery: '' });
    }
  }, [availableDeliveryModes, checkoutDraft.selectedDelivery, selectedOption, updateDraft]);

  const productsTotalCents = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.priceCents * item.quantity, 0),
    [cartItems]
  );

  // Use actual calculated fee if available, otherwise use estimated fee
  const deliveryFeeCents = useMemo(() => {
    if (actualDeliveryFee && checkoutDraft.addressValidated) {
      return actualDeliveryFee.deliveryFeeCents;
    }
    return Math.round((selectedOption?.price ?? 0) * 100);
  }, [actualDeliveryFee, selectedOption?.price, checkoutDraft.addressValidated]);

  // Calculate SMS notification cost (per seller, with platform fee)
  // SMS provider cost: ~€0.05 per SMS, platform fee: 20% = €0.01, total: €0.06 per seller
  const smsCostPerSellerCents = 6; // €0.06 per seller
  const uniqueSellerCount = useMemo(() => {
    const sellerIds = new Set(cartItems.map(item => item.sellerId).filter(Boolean));
    return sellerIds.size;
  }, [cartItems]);
  
  const smsNotificationCostCents = useMemo(
    () => checkoutDraft.enableSmsNotification ? smsCostPerSellerCents * uniqueSellerCount : 0,
    [checkoutDraft.enableSmsNotification, uniqueSellerCount]
  );

  const subtotalCents = productsTotalCents + deliveryFeeCents + smsNotificationCostCents;
  const { buyerTotalCents, stripeFeeCents } = useMemo(
    () => calculateStripeFeeForBuyer(subtotalCents),
    [subtotalCents]
  );

  const isTeenDeliveryUnavailable =
    checkoutDraft.selectedDelivery === 'teen_delivery' &&
    (!checkoutDraft.coordinates || !isDeliveryAvailable);

  const handleCheckout = async () => {
    if (!checkoutDraft.selectedDelivery) {
      alert(t('checkout.selectDeliveryOption'));
      return;
    }

    // Validate address before checkout
    if (
      (checkoutDraft.selectedDelivery === 'local_delivery' || checkoutDraft.selectedDelivery === 'teen_delivery') &&
      (!checkoutDraft.coordinates || !checkoutDraft.addressValidated)
    ) {
      alert(t('checkout.validateAddressFirst') || 'Valideer eerst je adres voordat je doorgaat');
      return;
    }

    if (isTeenDeliveryUnavailable) {
      alert(t('checkout.teenDeliveryUnavailable'));
      return;
    }

    setIsProcessing(true);
    setIsRedirecting(false);
    let didRedirect = false;

    try {
      // Build full address string
      const addressParts: string[] = [];
      if (checkoutDraft.street) addressParts.push(checkoutDraft.street);
      if (checkoutDraft.houseNumber) addressParts.push(checkoutDraft.houseNumber);
      if (checkoutDraft.postalCode) addressParts.push(checkoutDraft.postalCode);
      if (checkoutDraft.city) addressParts.push(checkoutDraft.city);
      const fullAddress = addressParts.join(', ');
      
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          deliveryMode: checkoutDraft.selectedDelivery.toUpperCase(),
          address: fullAddress,
          street: checkoutDraft.street,
          houseNumber: checkoutDraft.houseNumber,
          postalCode: checkoutDraft.postalCode,
          city: checkoutDraft.city,
          country: checkoutDraft.country || 'NL',
          notes: checkoutDraft.notes,
          pickupDate: checkoutDraft.selectedDelivery === 'pickup' ? checkoutDraft.deliveryDate : null,
          deliveryDate: checkoutDraft.selectedDelivery !== 'pickup' ? checkoutDraft.deliveryDate : null,
          deliveryTime: checkoutDraft.deliveryTime,
          coordinates: checkoutDraft.coordinates
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const details = data?.details ? `: ${data.details}` : '';
        throw new Error(
          data.error
            ? `${data.error}${details}`
            : `HTTP ${response.status}: ${response.statusText}`
        );
      }

      if (data.url) {
        resetCheckoutDraft();
        clearCart();
        setIsRedirecting(true);
        didRedirect = true;
        window.location.href = data.url;
        return;
      } else if (data.sessionId) {
        // For development mode
        resetCheckoutDraft();
        clearCart();
        setIsRedirecting(true);
        didRedirect = true;
        window.location.href = `/payment/success?session_id=${data.sessionId}`;
        return;
      } else {
        throw new Error(t('checkout.noCheckoutUrl'));
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : t('checkout.checkoutErrorGeneric');
      alert(t('checkout.checkoutError', { error: errorMessage }));
    } finally {
      if (!didRedirect) {
        setIsProcessing(false);
        setIsRedirecting(false);
      }
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-600">{t('checkout.sessionLoading')}</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('checkout.loginRequired')}</h1>
          <p className="text-gray-600 mb-8">{t('checkout.loginRequiredMessage')}</p>
          <Link href="/login">
            <Button>{t('checkout.login')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!isProcessing && !isRedirecting && cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('checkout.cartEmpty')}</h1>
          <Link href="/">
            <Button>{t('checkout.continueShopping')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-brand border-t-transparent mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('checkout.redirectingToStripe')}</h1>
          <p className="text-gray-600">
            Even geduld, je bestelling wordt veilig doorgestuurd naar de betaalomgeving.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-brand to-primary-700 px-6 py-8">
            <h1 className="text-3xl font-bold text-white mb-2">{t('checkout.checkoutTitle')}</h1>
            <p className="text-primary-100">{t('checkout.completeOrder')}</p>
          </div>

          <div className="p-6">
            {/* Step 1: Delivery Address First */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-500 rounded-xl">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{t('checkout.step1DeliveryAddress')}</h2>
                  <p className="text-sm text-gray-600">
                    {t('checkout.fillAddressToSeeOptions')}
                  </p>
                </div>
              </div>

              {/* Dynamic Address Fields - Compact Google Places Autocomplete for international, NL format for Netherlands */}
              <DynamicAddressFields
                value={{
                  address: checkoutDraft.street 
                    ? (checkoutDraft.houseNumber 
                        ? `${checkoutDraft.street} ${checkoutDraft.houseNumber}`.trim()
                        : checkoutDraft.street)
                    : '',
                  postalCode: checkoutDraft.postalCode,
                  houseNumber: checkoutDraft.houseNumber,
                  city: checkoutDraft.city,
                  country: checkoutDraft.country || 'NL',
                  lat: checkoutDraft.coordinates?.lat ?? null,
                  lng: checkoutDraft.coordinates?.lng ?? null,
                }}
                onChange={handleAddressChange}
                onGeocode={handleAddressGeocode}
                required={true}
                showValidation={true}
                geocodingEnabled={true}
                showCountrySelector={true}
                error={locationError || undefined}
              />
              
              {/* GPS Location Button */}
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  onClick={getLocation}
                  variant="outline"
                  title={t('common.useCurrentGPS')}
                  className="flex items-center gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  {t('common.useCurrentGPS') || 'Gebruik huidige locatie'}
                </Button>
              </div>

              {locationError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{locationError}</p>
                </div>
              )}

              {checkoutDraft.addressValidated && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-green-700 font-medium">
                      {t('checkout.addressValidatedCalculating')}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Locatie: {[
                        checkoutDraft.street,
                        checkoutDraft.houseNumber,
                        checkoutDraft.postalCode,
                        checkoutDraft.city,
                      ]
                        .filter(Boolean)
                        .join(', ') || (checkoutDraft.coordinates
                          ? `${checkoutDraft.coordinates.lat.toFixed(4)}, ${checkoutDraft.coordinates.lng.toFixed(4)}`
                          : 'Onbekend adres')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Delivery Options (only show after address is validated) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Delivery Options */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  {t('checkout.deliveryOption')}
                </h2>

                <div className="space-y-4">
                  {deliveryOptions.map((option) => {
                    const isTeenDelivery = option.id === 'teen_delivery';
                    const isLocalDelivery = option.id === 'local_delivery';
                    const isShipping = option.id === 'shipping';
                    const teenNeedsLocation = isTeenDelivery && !checkoutDraft.coordinates;
                    const teenUnavailableByRange =
                      isTeenDelivery && checkoutDraft.coordinates && !isDeliveryAvailable;
                    const isLoading = isTeenDelivery && availabilityLoading;
                    const cardDisabled = !option.available || (isTeenDelivery && (teenNeedsLocation || teenUnavailableByRange));
                    
                    // Show calculated fee for delivery/shipping options
                    const showCalculatedFee = (isTeenDelivery || isLocalDelivery || isShipping) && 
                                              actualDeliveryFee && 
                                              !isCalculatingFee;
                    const showLoadingFee = (isTeenDelivery || isLocalDelivery || isShipping) && 
                                           isCalculatingFee;
                    const showFallbackFee = (isTeenDelivery || isLocalDelivery || isShipping) && 
                                            !actualDeliveryFee;
                    
                    // Determine price to display
                    let displayPrice = option.price;
                    if (showCalculatedFee && actualDeliveryFee) {
                      displayPrice = actualDeliveryFee.deliveryFeeCents / 100;
                    }
                    
                    return (
                      <div
                        key={option.id}
                        className={`border-2 rounded-xl p-4 transition-all ${
                          cardDisabled
                            ? 'border-red-200 bg-red-50 cursor-not-allowed opacity-60'
                            : checkoutDraft.selectedDelivery === option.id
                            ? 'border-primary-brand bg-primary-50 cursor-pointer'
                            : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                        }`}
                        onClick={() => !cardDisabled && updateDraft({ selectedDelivery: option.id })}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${
                            checkoutDraft.selectedDelivery === option.id ? 'bg-primary-brand text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {option.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                {option.name}
                                {(isLoading || showLoadingFee) && <Loader2 className="w-4 h-4 animate-spin" />}
                                {cardDisabled && !isLoading && !showLoadingFee && (
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                )}
                              </h3>
                              {showCalculatedFee && (
                                <span className="text-lg font-bold text-primary-brand">
                                  €{displayPrice.toFixed(2)}
                                </span>
                              )}
                              {showLoadingFee && (
                                <span className="text-lg font-bold text-gray-500 flex items-center">
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> {t('common.calculating')}...
                                </span>
                              )}
                              {showFallbackFee && (
                                <span className="text-lg font-bold text-gray-500">
                                  {displayPrice === 0 ? 'Gratis' : `€${displayPrice.toFixed(2)}`}
                                </span>
                              )}
                              {!isTeenDelivery && !isLocalDelivery && !isShipping && (
                                <span className="text-lg font-bold text-primary-brand">
                                  {displayPrice === 0 ? 'Gratis' : `€${displayPrice.toFixed(2)}`}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                            {!option.available && (
                              <p className="text-sm text-red-600 mt-2 font-medium">
                                Deze optie is niet beschikbaar voor alle producten in je winkelwagen
                              </p>
                            )}
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {option.estimatedTime}
                            </div>
                            {(isTeenDelivery || isLocalDelivery) && actualDeliveryFee && !isCalculatingFee && (
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {actualDeliveryFee.distance.toFixed(1)} km
                                {actualDeliveryFee.isInternational && <span className="ml-1 text-blue-600 font-medium">({t('checkout.international')})</span>}
                              </p>
                            )}
                            {isShipping && actualDeliveryFee && !isCalculatingFee && (
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                {actualDeliveryFee.isInternational ? t('checkout.international') : t('checkout.national')}
                              </p>
                            )}
                            {isTeenDelivery && (
                              <div
                                className={`mt-3 text-sm ${
                                  isLoading
                                    ? 'text-blue-600'
                                    : teenNeedsLocation
                                    ? 'text-gray-600'
                                    : teenUnavailableByRange
                                    ? 'text-red-700'
                                    : 'text-emerald-700'
                                }`}
                              >
                                {isLoading
                                  ? 'Beschikbaarheid wordt gecontroleerd…'
                                  : teenNeedsLocation
                                  ? 'Valideer je adres om jongeren bezorging te controleren.'
                                  : availability.message || 'Bezorgersstatus onbekend.'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Teen Delivery Info */}
                {checkoutDraft.selectedDelivery === 'teen_delivery' && (
                  <div className="mt-6 space-y-4">
                    <TeenDeliveryInfo />

                    <div
                      className={`p-4 rounded-xl border-2 ${
                        availabilityLoading
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : !checkoutDraft.coordinates
                          ? 'border-gray-200 bg-gray-50 text-gray-700'
                          : isDeliveryAvailable
                          ? 'border-green-200 bg-gradient-to-r from-green-50 to-blue-50 text-green-800'
                          : 'border-red-200 bg-red-50 text-red-700'
                      }`}
                    >
                      <p className="font-semibold">
                        {availabilityLoading
                          ? t('checkout.checkingAvailability')
                          : !checkoutDraft.coordinates
                          ? t('checkout.validateAddressToSeeTeenDeliverers')
                          : availability.message ||
                            (isDeliveryAvailable
                              ? t('checkout.deliverersAvailable')
                              : t('checkout.noDeliverersAvailable'))}
                      </p>
                      {checkoutDraft.coordinates && availability.availableCount !== undefined && (
                        <p className="text-sm mt-1">
                          {isDeliveryAvailable
                            ? `${availability.availableCount} bezorger${availability.availableCount === 1 ? '' : 's'} staan klaar.`
                            : 'Probeer het later opnieuw of kies voor afhalen.'}
                        </p>
                      )}
                    </div>

                    {checkoutDraft.coordinates && isDeliveryAvailable && (
                      <div className="p-4 bg-white rounded-xl border border-green-200 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-green-500 rounded-lg">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 text-sm text-green-800 space-y-2">
                            <p>
                              {t('checkout.allAvailableDeliverers')}
                              <strong> {t('checkout.firstAcceptsDelivers')}</strong>
                            </p>
                            <ul className="space-y-1">
                              <li>✓ {t('checkout.withinRadius')}</li>
                              <li>✓ {t('checkout.availableInTimeSlot')}</li>
                              <li>✓ {t('checkout.notificationOnAcceptance')}</li>
                              <li>✓ {t('checkout.directMessagesWithDeliverer')}</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Delivery Details */}
                {checkoutDraft.selectedDelivery && checkoutDraft.selectedDelivery !== 'pickup' && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-900 mb-4">{t('checkout.deliveryDetails')}</h3>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Clock className="w-4 h-4 inline mr-1" />
                          {checkoutDraft.selectedDelivery === 'pickup' ? t('checkout.pickupDate') : t('checkout.deliveryDate')}
                        </label>
                        <input
                          type="date"
                          value={checkoutDraft.deliveryDate}
                          onChange={(e) => updateDraft({ deliveryDate: e.target.value })}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tijd
                        </label>
                        <select
                          value={checkoutDraft.deliveryTime}
                          onChange={(e) => updateDraft({ deliveryTime: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand"
                        >
                          <option value="">{t('checkout.chooseTime')}</option>
                          <option value="09:00-12:00">09:00-12:00</option>
                          <option value="12:00-15:00">12:00-15:00</option>
                          <option value="15:00-18:00">15:00-18:00</option>
                          <option value="18:00-21:00">18:00-21:00</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('checkout.notesOptional')}
                      </label>
                      <textarea
                        value={checkoutDraft.notes}
                        onChange={(e) => updateDraft({ notes: e.target.value })}
                        placeholder={t('checkout.notesPlaceholder')}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand"
                        rows={2}
                      />
                    </div>

                    {/* SMS Notification Option */}
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checkoutDraft.enableSmsNotification}
                          onChange={(e) => updateDraft({ enableSmsNotification: e.target.checked })}
                          className="mt-1 w-4 h-4 text-primary-brand border-gray-300 rounded focus:ring-primary-brand"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-gray-900">{t('checkout.smsNotificationForSellers')}</span>
                            <span className="text-sm text-blue-600 font-semibold">
                              (+€{(smsCostPerSellerCents / 100).toFixed(2)} per verkoper)
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {t('checkout.smsNotificationDescription')} 
                            {uniqueSellerCount > 1 && ` ${t('checkout.smsCostForSellers', { cost: (smsNotificationCostCents / 100).toFixed(2), count: uniqueSellerCount })}`}
                            {uniqueSellerCount === 1 && ` ${t('checkout.smsCostPerSeller', { cost: (smsCostPerSellerCents / 100).toFixed(2) })}`}
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Bestelling Overzicht
                </h2>

                <div className="bg-gray-50 rounded-xl p-6">
                  {/* Items */}
                  <div className="space-y-4 mb-6">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.title}</h3>
                          <p className="text-sm text-gray-600">Aantal: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            €{((item.priceCents * item.quantity) / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="space-y-2 border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-sm">
                      <span>Subtotaal</span>
                      <span>€{(productsTotalCents / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>
                        Bezorgkosten
                        {actualDeliveryFee && checkoutDraft.addressValidated && (
                          <span className="text-xs text-gray-500 ml-2">
                            ({actualDeliveryFee.distance.toFixed(1)} km
                            {actualDeliveryFee.isInternational && ` • ${t('checkout.international')}`})
                          </span>
                        )}
                        {isCalculatingFee && (
                          <span className="text-xs text-gray-500 ml-2">(berekenen...)</span>
                        )}
                      </span>
                      <span>
                        {isCalculatingFee ? (
                          <Loader2 className="w-4 h-4 animate-spin inline" />
                        ) : (
                          `€${(deliveryFeeCents / 100).toFixed(2)}`
                        )}
                      </span>
                    </div>
                    {smsNotificationCostCents > 0 && (
                      <div className="flex justify-between text-sm text-blue-600">
                        <span>SMS Notificatie ({uniqueSellerCount} verkoper{uniqueSellerCount > 1 ? 's' : ''})</span>
                        <span>€{(smsNotificationCostCents / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span>Transactiekosten (Stripe)</span>
                      <span>€{(stripeFeeCents / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                      <span>Totaal</span>
                      <span className="text-primary-brand">€{(buyerTotalCents / 100).toFixed(2)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-3">
                    Stripe-kosten worden doorberekend aan de koper. HomeCheff-kosten worden verrekend met de verkoper.
                  </p>

                  {/* Checkout Button */}
                  <Button
                    onClick={handleCheckout}
                    disabled={
                      isProcessing ||
                      !checkoutDraft.selectedDelivery ||
                      isTeenDeliveryUnavailable ||
                      buyerTotalCents <= 0
                    }
                    className="w-full mt-6 py-4 text-lg"
                  >
                    {isProcessing ? (
                      'Verwerken...'
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Afrekenen - €{(buyerTotalCents / 100).toFixed(2)}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    Je wordt doorgestuurd naar Stripe voor veilige betaling
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}