'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { MapPin, Clock, Package, Truck, Bike, Users, CreditCard, CheckCircle, Navigation, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import TeenDeliveryInfo from '@/components/delivery/TeenDeliveryInfo';
import DelivererSelector from '@/components/checkout/DelivererSelector';
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
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedDeliverers, setSelectedDeliverers] = useState<{[productId: string]: any}>({});

  // Check delivery availability
  const { 
    availability,
    loading: availabilityLoading 
  } = useDeliveryAvailability(coordinates);
  
  const isDeliveryAvailable = availability.isAvailable;
  const availableDeliverers = 1; // Mock value
  const estimatedDeliveryTime = availability.estimatedTime;

  // Get current location for delivery
  const getLocation = async () => {
    try {
      setLocationError(null);
      const coords = await getCurrentLocation();
      setCoordinates(coords);
    } catch (error) {
      console.error('Location error:', error);
      setLocationError('Locatie kon niet worden opgehaald. Voer handmatig een adres in.');
    }
  };

  const handleSelectDeliverer = (productId: string, deliverer: any) => {
    setSelectedDeliverers(prev => ({
      ...prev,
      [productId]: deliverer
    }));
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
      description: 'Jongeren vanaf 15 jaar bezorgen in de buurt (wettelijk toegestaan)',
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

    if ((selectedDelivery === 'local_delivery' || selectedDelivery === 'teen_delivery') && !deliveryAddress) {
      alert('Voer een bezorgadres in');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          deliveryMode: selectedDelivery.toUpperCase(),
          address: deliveryAddress,
          notes,
          pickupDate: selectedDelivery === 'pickup' ? deliveryDate : null,
          deliveryDate: selectedDelivery !== 'pickup' ? deliveryDate : null,
          deliveryTime,
          coordinates: coordinates,
          selectedDeliverers: selectedDeliverers
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
                              {isTeenDelivery && coordinates && isDeliveryAvailable && (
                                <span className="text-green-600 font-medium">
                                  • {availableDeliverers} bezorger{availableDeliverers !== 1 ? 's' : ''} beschikbaar
                                </span>
                              )}
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
                  </div>
                )}

                {/* Deliverer Selection for Teen Delivery */}
                {selectedDelivery === 'teen_delivery' && coordinates && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Kies bezorgers per product
                    </h3>
                    <div className="space-y-6">
                      {cartItems.map((item) => (
                        <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{item.title}</h4>
                              <p className="text-sm text-gray-600">Aantal: {item.quantity}</p>
                            </div>
                          </div>
                          
                          <DelivererSelector
                            productId={item.productId}
                            buyerLat={coordinates.lat}
                            buyerLng={coordinates.lng}
                            onSelectDeliverer={(deliverer) => handleSelectDeliverer(item.productId, deliverer)}
                            selectedDelivererId={selectedDeliverers[item.productId]?.id}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Delivery Details */}
                {selectedDelivery && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-900 mb-4">Bezorgdetails</h3>
                    
                    {(selectedDelivery === 'local_delivery' || selectedDelivery === 'teen_delivery') && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <MapPin className="w-4 h-4 inline mr-1" />
                          Bezorgadres
                        </label>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <textarea
                              value={deliveryAddress}
                              onChange={(e) => setDeliveryAddress(e.target.value)}
                              placeholder="Straat, huisnummer, postcode, plaats"
                              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand"
                              rows={3}
                            />
                            <Button
                              type="button"
                              onClick={getLocation}
                              variant="outline"
                              className="px-3 py-2 h-auto"
                              title="Huidige locatie gebruiken"
                            >
                              <Navigation className="w-4 h-4" />
                            </Button>
                          </div>
                          {coordinates && (
                            <p className="text-sm text-green-600 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Locatie opgehaald: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                            </p>
                          )}
                          {locationError && (
                            <p className="text-sm text-red-600">{locationError}</p>
                          )}
                        </div>
                      </div>
                    )}

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