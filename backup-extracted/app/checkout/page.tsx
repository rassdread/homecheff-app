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
  deliveryDate: string;
  deliveryTime: string;
  notes: string;
  coordinates: { lat: number; lng: number } | null;
  addressValidated: boolean;
  enableSmsNotification: boolean; // SMS notificatie optie voor verkopers
};

export default function CheckoutPage() {
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

  // Get product locations from cart for delivery matching
  const [sellerLocations, setSellerLocations] = useState<Array<{lat: number, lng: number, productId: string}>>([]);
  
  // Fetch product locations when cart items change
  useEffect(() => {
    const fetchProductLocations = async () => {
      if (cartItems.length === 0) {
        setSellerLocations([]);
        return;
      }

      try {
        const productIds = cartItems.map(item => item.productId);
        const locations: Array<{lat: number, lng: number, productId: string}> = [];
        
        for (const productId of productIds) {
          const response = await fetch(`/api/products/${productId}`);
          if (response.ok) {
            const data = await response.json();
            const product = data.product || data;
            // Seller location can be in product.seller.User.lat/lng or product.seller.lat/lng
            const sellerLat = product.seller?.User?.lat || product.seller?.lat;
            const sellerLng = product.seller?.User?.lng || product.seller?.lng;
            
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
      checkoutDraft.city
    );
  }, [checkoutDraft.street, checkoutDraft.houseNumber, checkoutDraft.postalCode, checkoutDraft.city]);

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

  // Geocode the entered address to get coordinates
  const geocodeAddress = async () => {
    if (!checkoutDraft.houseNumber || !checkoutDraft.postalCode) {
      setLocationError('Vul postcode en huisnummer in om te valideren');
      return;
    }

    setIsGeocodingAddress(true);
    setLocationError(null);

    try {
      // Use the Dutch geocoding API with postcode and huisnummer
      const cleanPostcode = checkoutDraft.postalCode.replace(/\s/g, '').toUpperCase();
      const response = await fetch(`/api/geocoding/dutch?postcode=${encodeURIComponent(cleanPostcode)}&huisnummer=${encodeURIComponent(checkoutDraft.houseNumber)}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.lat && data.lng) {
          const updates: Partial<CheckoutDraft> = {
            coordinates: { lat: data.lat, lng: data.lng },
            addressValidated: true,
          };

          if (data.street) {
            updates.street = data.street;
          }
          if (data.city) {
            updates.city = data.city;
          }

          updateDraft(updates);
        } else {
          setLocationError('Adres niet gevonden. Controleer de postcode en huisnummer.');
          updateDraft({
            coordinates: null,
            addressValidated: false,
          });
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Onbekende fout' }));
        setLocationError(errorData.error || 'Kon adres niet valideren. Probeer het opnieuw.');
        updateDraft({
          coordinates: null,
          addressValidated: false,
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setLocationError('Er is een fout opgetreden bij het valideren van het adres.');
      updateDraft({
        coordinates: null,
        addressValidated: false,
      });
    } finally {
      setIsGeocodingAddress(false);
    }
  };

  const deliveryOptions: DeliveryOption[] = [
    {
      id: 'pickup',
      name: 'Ophalen',
      description: 'Je haalt de producten zelf op bij de verkoper',
      icon: <Package className="w-6 h-6" />,
      price: 0,
      estimatedTime: 'Afhankelijk van verkoper',
      available: true
    },
    {
      id: 'local_delivery',
      name: 'Lokaal Bezorgen',
      description: 'De verkoper bezorgt zelf in de buurt',
      icon: <Truck className="w-6 h-6" />,
      price: 3,
      estimatedTime: 'Binnen 24 uur',
      available: true
    },
    {
      id: 'teen_delivery',
      name: 'Jongeren Bezorgen (15+)',
      description: 'Beschikbare jongeren uit de buurt bezorgen jouw bestelling.',
      icon: <Users className="w-6 h-6" />,
      price: 2,
      estimatedTime: estimatedDeliveryTime ? `${estimatedDeliveryTime} min` : 'Binnen 3 uur',
      available: true
    },
    {
      id: 'shipping',
      name: 'Verzenden',
      description: 'DHL/PostNL verzending (alleen voor Designer items)',
      icon: <Truck className="w-6 h-6" />,
      price: 8,
      estimatedTime: '1-3 werkdagen',
      available: true // Always available for now
    }
  ];

  const availableOptions = deliveryOptions.filter(option => option.available);
  const selectedOption = deliveryOptions.find(option => option.id === checkoutDraft.selectedDelivery);

  const productsTotalCents = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.priceCents * item.quantity, 0),
    [cartItems]
  );

  const estimatedDeliveryFeeCents = useMemo(
    () => Math.round((selectedOption?.price ?? 0) * 100),
    [selectedOption?.price]
  );

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

  const subtotalCents = productsTotalCents + estimatedDeliveryFeeCents + smsNotificationCostCents;
  const { buyerTotalCents, stripeFeeCents } = useMemo(
    () => calculateStripeFeeForBuyer(subtotalCents),
    [subtotalCents]
  );

  const isTeenDeliveryUnavailable =
    checkoutDraft.selectedDelivery === 'teen_delivery' &&
    (!checkoutDraft.coordinates || !isDeliveryAvailable);

  const handleCheckout = async () => {
    if (!checkoutDraft.selectedDelivery) {
      alert('Selecteer een bezorgoptie');
      return;
    }

    if (
      (checkoutDraft.selectedDelivery === 'local_delivery' || checkoutDraft.selectedDelivery === 'teen_delivery') &&
      (!checkoutDraft.houseNumber || !checkoutDraft.postalCode)
    ) {
      alert('Vul postcode en huisnummer in om bezorgopties te zien');
      return;
    }

    // Validate address before checkout
    if (
      (checkoutDraft.selectedDelivery === 'local_delivery' || checkoutDraft.selectedDelivery === 'teen_delivery') &&
      !checkoutDraft.addressValidated
    ) {
      alert('Valideer eerst je adres door op "Valideer Adres" te klikken');
      return;
    }

    if (isTeenDeliveryUnavailable) {
      alert('Jongeren bezorging is momenteel niet beschikbaar. Kies een andere optie.');
      return;
    }

    setIsProcessing(true);
    setIsRedirecting(false);
    let didRedirect = false;

    try {
      const fullAddress = `${checkoutDraft.street} ${checkoutDraft.houseNumber}, ${checkoutDraft.postalCode} ${checkoutDraft.city}`;
      
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
        throw new Error('Geen checkout URL ontvangen');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Er is een fout opgetreden bij het afrekenen';
      alert(`Checkout fout: ${errorMessage}`);
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
        <div className="text-center text-gray-600">Je sessie wordt geladen...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Inloggen vereist</h1>
          <p className="text-gray-600 mb-8">Je moet ingelogd zijn om af te rekenen</p>
          <Link href="/login">
            <Button>Inloggen</Button>
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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Je winkelwagen is leeg</h1>
          <Link href="/">
            <Button>Verder winkelen</Button>
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">We leiden je om naar Stripe…</h1>
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
            <h1 className="text-3xl font-bold text-white mb-2">Afrekenen</h1>
            <p className="text-primary-100">Voltooi je bestelling</p>
          </div>

          <div className="p-6">
            {/* Step 1: Delivery Address First */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-500 rounded-xl">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Stap 1: Bezorgadres</h2>
                  <p className="text-sm text-gray-600">
                    Vul je adres in om te zien welke bezorgopties beschikbaar zijn
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postcode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={checkoutDraft.postalCode}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/\s/g, '');
                      updateDraft({ postalCode: value, addressValidated: false });
                    }}
                    placeholder="1234AB"
                    maxLength={6}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Huisnummer <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={checkoutDraft.houseNumber}
                    onChange={(e) =>
                      updateDraft({ houseNumber: e.target.value, addressValidated: false })
                    }
                    placeholder="123"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Straatnaam (wordt automatisch ingevuld)
                  </label>
                  <input
                    type="text"
                    value={checkoutDraft.street}
                    onChange={(e) =>
                      updateDraft({ street: e.target.value, addressValidated: false })
                    }
                    placeholder="Wordt ingevuld na validatie"
                    readOnly
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plaats (wordt automatisch ingevuld)
                  </label>
                  <input
                    type="text"
                    value={checkoutDraft.city}
                    onChange={(e) =>
                      updateDraft({ city: e.target.value, addressValidated: false })
                    }
                    placeholder="Wordt ingevuld na validatie"
                    readOnly
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
                <div className="md:col-span-2 flex items-end gap-2">
                  <Button
                    type="button"
                    onClick={geocodeAddress}
                    disabled={
                      isGeocodingAddress ||
                      !checkoutDraft.houseNumber ||
                      !checkoutDraft.postalCode
                    }
                    className="flex-1"
                  >
                    {isGeocodingAddress ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Valideren...
                      </>
                    ) : checkoutDraft.addressValidated ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Adres Gevalideerd
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4 mr-2" />
                        Valideer Adres
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={getLocation}
                    variant="outline"
                    title="Gebruik huidige GPS-locatie"
                  >
                    <Navigation className="w-4 h-4" />
                  </Button>
                </div>
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
                      ✅ Adres gevalideerd en bezorgopties worden berekend
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
                  Bezorgoptie
                </h2>

                <div className="space-y-4">
                  {availableOptions.map((option) => {
                    const isTeenDelivery = option.id === 'teen_delivery';
                    const teenNeedsLocation = isTeenDelivery && !checkoutDraft.coordinates;
                    const teenUnavailableByRange =
                      isTeenDelivery && checkoutDraft.coordinates && !isDeliveryAvailable;
                    const isLoading = isTeenDelivery && availabilityLoading;
                    const cardDisabled = isTeenDelivery && (teenNeedsLocation || teenUnavailableByRange);
                    
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
                                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {cardDisabled && !isLoading && (
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                )}
                              </h3>
                              <span className="text-lg font-bold text-primary-brand">
                                {option.price === 0 ? 'Gratis' : `€${option.price.toFixed(2)}`}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {option.estimatedTime}
                            </div>
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
                          ? 'Beschikbaarheid wordt gecontroleerd…'
                          : !checkoutDraft.coordinates
                          ? 'Valideer je adres om beschikbare jongeren bezorgers te zien.'
                          : availability.message ||
                            (isDeliveryAvailable
                              ? 'Bezorgers beschikbaar in jouw regio.'
                              : 'Geen bezorgers beschikbaar in jouw regio op dit moment.')}
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
                              Alle beschikbare bezorgers in jouw gebied ontvangen een notificatie.
                              <strong> De eerste die accepteert</strong> bezorgt jouw bestelling!
                            </p>
                            <ul className="space-y-1">
                              <li>✓ Binnen radius van zowel verkoper als koper</li>
                              <li>✓ Beschikbaar in jouw gekozen tijdslot</li>
                              <li>✓ Je krijgt meteen een melding bij acceptatie</li>
                              <li>✓ Direct berichten met de bezorger mogelijk</li>
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
                    <h3 className="font-semibold text-gray-900 mb-4">Bezorgdetails</h3>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Clock className="w-4 h-4 inline mr-1" />
                          {checkoutDraft.selectedDelivery === 'pickup' ? 'Ophaaldatum' : 'Bezorgdatum'}
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
                          <option value="">Kies tijd</option>
                          <option value="09:00-12:00">09:00-12:00</option>
                          <option value="12:00-15:00">12:00-15:00</option>
                          <option value="15:00-18:00">15:00-18:00</option>
                          <option value="18:00-21:00">18:00-21:00</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Opmerkingen (optioneel)
                      </label>
                      <textarea
                        value={checkoutDraft.notes}
                        onChange={(e) => updateDraft({ notes: e.target.value })}
                        placeholder="Bijv. bel aan, achterdeur, etc."
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
                            <span className="font-medium text-gray-900">SMS Notificatie voor verkopers</span>
                            <span className="text-sm text-blue-600 font-semibold">
                              (+€{(smsCostPerSellerCents / 100).toFixed(2)} per verkoper)
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Verkopers ontvangen een SMS bij nieuwe bestellingen. 
                            {uniqueSellerCount > 1 && ` Kosten: €${(smsNotificationCostCents / 100).toFixed(2)} voor ${uniqueSellerCount} verkopers.`}
                            {uniqueSellerCount === 1 && ` Kosten: €${(smsCostPerSellerCents / 100).toFixed(2)}.`}
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
                      <span>Bezorgkosten</span>
                      <span>€{(estimatedDeliveryFeeCents / 100).toFixed(2)}</span>
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