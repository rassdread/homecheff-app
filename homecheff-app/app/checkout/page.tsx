'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { MapPin, Clock, Package, Truck, Bike, Users, CreditCard, CheckCircle, Navigation, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import TeenDeliveryInfo from '@/components/delivery/TeenDeliveryInfo';
import { getCurrentLocation } from '@/lib/geolocation';
import { useDeliveryAvailability } from '@/hooks/useDeliveryAvailability';

type DeliveryOption = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  price: number;
  estimatedTime: string;
  available: boolean;
};

export default function CheckoutPage() {
  const { items: cartItems, clearCart } = useCart();
  const { data: session } = useSession();
  const [selectedDelivery, setSelectedDelivery] = useState<string>('');
  
  // Address fields
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [addressValidated, setAddressValidated] = useState(false);

  // Check delivery availability
  const { 
    availability,
    loading: availabilityLoading 
  } = useDeliveryAvailability(coordinates);
  
  const isDeliveryAvailable = availability.isAvailable;
  const availableDeliverersCount = 0; // Will be updated when deliverers are available
  const estimatedDeliveryTime = availability.estimatedTime;

  // Get current location for delivery
  const getLocation = async () => {
    try {
      setLocationError(null);
      const coords = await getCurrentLocation();
      setCoordinates(coords);
      setAddressValidated(true);
    } catch (error) {
      console.error('Location error:', error);
      setLocationError('Locatie kon niet worden opgehaald. Voer handmatig een adres in.');
    }
  };

  // Geocode the entered address to get coordinates
  const geocodeAddress = async () => {
    if (!street || !houseNumber || !postalCode || !city) {
      setLocationError('Vul alle adresvelden in');
      return;
    }

    setIsGeocodingAddress(true);
    setLocationError(null);

    try {
      const fullAddress = `${street} ${houseNumber}, ${postalCode} ${city}, Nederland`;
      
      // Use the Dutch geocoding API
      const response = await fetch(`/api/geocoding/dutch?address=${encodeURIComponent(fullAddress)}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.lat && data.lng) {
          setCoordinates({ lat: data.lat, lng: data.lng });
          setAddressValidated(true);
          console.log('✅ Adres gevalideerd:', fullAddress, '→', data.lat, data.lng);
        } else {
          setLocationError('Adres niet gevonden. Controleer de gegevens.');
        }
      } else {
        setLocationError('Kon adres niet valideren. Probeer het opnieuw.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setLocationError('Er is een fout opgetreden bij het valideren van het adres.');
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
      description: coordinates && isDeliveryAvailable 
        ? 'Bezorgers beschikbaar - eerste die accepteert bezorgt'
        : 'Jongeren vanaf 15 jaar bezorgen in de buurt (wettelijk toegestaan)',
      icon: <Users className="w-6 h-6" />,
      price: 2,
      estimatedTime: estimatedDeliveryTime ? `${estimatedDeliveryTime} min` : 'Binnen 3 uur',
      available: coordinates ? isDeliveryAvailable : true // Only check if coordinates are available
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
  const selectedOption = deliveryOptions.find(option => option.id === selectedDelivery);
  const totalAmount = cartItems.reduce((sum, item) => sum + item.priceCents * item.quantity, 0) + (selectedOption?.price || 0) * 100; // Convert to cents

  const handleCheckout = async () => {
    if (!selectedDelivery) {
      alert('Selecteer een bezorgoptie');
      return;
    }

    if ((selectedDelivery === 'local_delivery' || selectedDelivery === 'teen_delivery') && (!street || !houseNumber || !postalCode || !city)) {
      alert('Vul alle adresvelden in');
      return;
    }

    // Validate address before checkout
    if ((selectedDelivery === 'local_delivery' || selectedDelivery === 'teen_delivery') && !addressValidated) {
      alert('Valideer eerst je adres door op "Valideer Adres" te klikken');
      return;
    }

    setIsProcessing(true);

    try {
      const fullAddress = `${street} ${houseNumber}, ${postalCode} ${city}`;
      
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          deliveryMode: selectedDelivery.toUpperCase(),
          address: fullAddress,
          street,
          houseNumber,
          postalCode,
          city,
          notes,
          pickupDate: selectedDelivery === 'pickup' ? deliveryDate : null,
          deliveryDate: selectedDelivery !== 'pickup' ? deliveryDate : null,
          deliveryTime,
          coordinates: coordinates
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (data.url) {
        window.location.href = data.url;
      } else if (data.sessionId) {
        // For development mode
        window.location.href = `/payment/success?session_id=${data.sessionId}`;
      } else {
        throw new Error('Geen checkout URL ontvangen');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Er is een fout opgetreden bij het afrekenen';
      alert(`Checkout fout: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

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

  if (cartItems.length === 0) {
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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Straatnaam
                  </label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => {
                      setStreet(e.target.value);
                      setAddressValidated(false);
                    }}
                    placeholder="Bijv. Hoofdstraat"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Huisnummer
                  </label>
                  <input
                    type="text"
                    value={houseNumber}
                    onChange={(e) => {
                      setHouseNumber(e.target.value);
                      setAddressValidated(false);
                    }}
                    placeholder="123"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postcode
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => {
                      setPostalCode(e.target.value.toUpperCase());
                      setAddressValidated(false);
                    }}
                    placeholder="1234AB"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand uppercase"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plaats
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      setAddressValidated(false);
                    }}
                    placeholder="Bijv. Amsterdam"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand"
                  />
                </div>
                <div className="md:col-span-2 flex items-end gap-2">
                  <Button
                    type="button"
                    onClick={geocodeAddress}
                    disabled={isGeocodingAddress || !street || !houseNumber || !postalCode || !city}
                    className="flex-1"
                  >
                    {isGeocodingAddress ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Valideren...
                      </>
                    ) : addressValidated ? (
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

              {addressValidated && coordinates && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-green-700 font-medium">
                      ✅ Adres gevalideerd en bezorgopties worden berekend
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Locatie: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
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
                    const isUnavailable = isTeenDelivery && coordinates && !isDeliveryAvailable;
                    const isLoading = isTeenDelivery && availabilityLoading;
                    
                    return (
                      <div
                        key={option.id}
                        className={`border-2 rounded-xl p-4 transition-all ${
                          isUnavailable 
                            ? 'border-red-200 bg-red-50 cursor-not-allowed opacity-60'
                            : selectedDelivery === option.id
                            ? 'border-primary-brand bg-primary-50 cursor-pointer'
                            : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                        }`}
                        onClick={() => !isUnavailable && setSelectedDelivery(option.id)}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${
                            selectedDelivery === option.id ? 'bg-primary-brand text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {option.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                {option.name}
                                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isUnavailable && <AlertCircle className="w-4 h-4 text-red-500" />}
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
                            {isUnavailable && (
                              <div className="mt-2 p-2 bg-red-100 rounded-lg">
                                <p className="text-sm text-red-700">
                                  Momenteel geen bezorgers beschikbaar in jouw regio. Probeer het later opnieuw of kies voor afhalen.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Teen Delivery Info */}
                {selectedDelivery === 'teen_delivery' && (
                  <div className="mt-6">
                    <TeenDeliveryInfo />
                    
                    {coordinates && isDeliveryAvailable && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border-2 border-green-200">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-green-500 rounded-lg">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-green-900 mb-2">
                              🎯 Bezorgers beschikbaar
                            </h4>
                            <p className="text-sm text-green-800 mb-3">
                              Alle beschikbare bezorgers in jouw gebied ontvangen een notificatie. 
                              <strong> De eerste die accepteert</strong> bezorgt jouw bestelling!
                            </p>
                            <ul className="text-xs text-green-700 space-y-1">
                              <li>✓ Bezorgers binnen 10km van verkoper én jou</li>
                              <li>✓ Beschikbaar in jouw gekozen tijdslot</li>
                              <li>✓ Je krijgt een notificatie zodra een bezorger accepteert</li>
                              <li>✓ Direct bericht sturen naar bezorger om af te stemmen</li>
                              <li>✓ Snelle matching = snellere bezorging</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Delivery Details */}
                {selectedDelivery && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-900 mb-4">Bezorgdetails</h3>
                    

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Clock className="w-4 h-4 inline mr-1" />
                          {selectedDelivery === 'pickup' ? 'Ophaaldatum' : 'Bezorgdatum'}
                        </label>
                        <input
                          type="date"
                          value={deliveryDate}
                          onChange={(e) => setDeliveryDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tijd
                        </label>
                        <select
                          value={deliveryTime}
                          onChange={(e) => setDeliveryTime(e.target.value)}
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
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Bijv. bel aan, achterdeur, etc."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand"
                        rows={2}
                      />
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
                      <span>Subtotaal:</span>
                      <span>€{(cartItems.reduce((sum, item) => sum + item.priceCents * item.quantity, 0) / 100).toFixed(2)}</span>
                    </div>
                    {selectedOption && selectedOption.price > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Bezorgkosten:</span>
                        <span>€{selectedOption.price.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                      <span>Totaal:</span>
                      <span className="text-primary-brand">€{(totalAmount / 100).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <Button
                    onClick={handleCheckout}
                    disabled={isProcessing || !selectedDelivery}
                    className="w-full mt-6 py-4 text-lg"
                  >
                    {isProcessing ? (
                      'Verwerken...'
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Afrekenen - €{(totalAmount / 100).toFixed(2)}
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