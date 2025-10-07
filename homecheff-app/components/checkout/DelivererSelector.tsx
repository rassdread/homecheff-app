'use client';

import { useState, useEffect } from 'react';
import { MapPin, Clock, Star, Truck, Bike, Car, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface Deliverer {
  id: string;
  userId: string;
  name: string;
  place: string;
  profileImage?: string;
  vehicleType: string;
  deliveryRadius: number;
  distanceToSeller: number;
  distanceToBuyer: number;
  totalDeliveryDistance: number;
  rating: number;
  completedDeliveries: number;
}

interface RegionInfo {
  country: string;
  isCaribbean: boolean;
  deliveryMode: 'island' | 'distance';
}

interface DelivererSelectorProps {
  productId: string;
  buyerLat?: number;
  buyerLng?: number;
  onSelectDeliverer: (deliverer: Deliverer) => void;
  selectedDelivererId?: string;
}

export default function DelivererSelector({ 
  productId, 
  buyerLat, 
  buyerLng, 
  onSelectDeliverer, 
  selectedDelivererId 
}: DelivererSelectorProps) {
  const [deliverers, setDeliverers] = useState<Deliverer[]>([]);
  const [regionInfo, setRegionInfo] = useState<RegionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      fetchDeliverers();
    }
  }, [productId, buyerLat, buyerLng]);

  const fetchDeliverers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        productId,
        ...(buyerLat && buyerLng && {
          buyerLat: buyerLat.toString(),
          buyerLng: buyerLng.toString()
        })
      });

      const response = await fetch(`/api/delivery/match-deliverers?${params}`);
      const data = await response.json();

      if (data.success) {
        setDeliverers(data.matchedDeliverers);
        setRegionInfo(data.region);
      } else {
        setError(data.error || 'Geen bezorgers gevonden');
      }
    } catch (err) {
      setError('Fout bij het ophalen van bezorgers');
      console.error('Error fetching deliverers:', err);
    } finally {
      setLoading(false);
    }
  };

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case 'BIKE': return <Bike className="w-4 h-4" />;
      case 'EBIKE': return <Bike className="w-4 h-4" />;
      case 'SCOOTER': return <Truck className="w-4 h-4" />;
      case 'CAR': return <Car className="w-4 h-4" />;
      default: return <Truck className="w-4 h-4" />;
    }
  };

  const getVehicleName = (vehicleType: string) => {
    switch (vehicleType) {
      case 'BIKE': return 'Fiets';
      case 'EBIKE': return 'E-bike';
      case 'SCOOTER': return 'Scooter';
      case 'CAR': return 'Auto';
      default: return 'Voertuig';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-green-600 mr-2" />
          <span className="text-gray-600">Bezorgers zoeken...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  if (deliverers.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
          <span className="text-yellow-700">Geen bezorgers beschikbaar in de buurt</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Kies een bezorger ({deliverers.length} beschikbaar)
        </h3>
        {regionInfo && (
          <div className="text-sm text-gray-600">
            {regionInfo.isCaribbean ? (
              <span className="flex items-center gap-1">
                🏝️ <span>Eiland: {regionInfo.country}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                🌍 <span>Land: {regionInfo.country}</span>
              </span>
            )}
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        {deliverers.map((deliverer) => (
          <div
            key={deliverer.id}
            onClick={() => onSelectDeliverer(deliverer)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedDelivererId === deliverer.id
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                {/* Profile Image */}
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {deliverer.profileImage ? (
                    <img
                      src={deliverer.profileImage}
                      alt={deliverer.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-500 font-medium text-lg">
                      {deliverer.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Deliverer Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{deliverer.name}</h4>
                    {selectedDelivererId === deliverer.id && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{deliverer.place}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {getVehicleIcon(deliverer.vehicleType)}
                      <span>{getVehicleName(deliverer.vehicleType)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span>{deliverer.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Distance Info */}
                  <div className="mt-2 text-xs text-gray-600">
                    {regionInfo?.isCaribbean ? (
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center gap-1">
                          🏝️ <span>Op hetzelfde eiland</span>
                        </span>
                        <span className="font-medium text-green-600">
                          {deliverer.distanceToSeller.toFixed(1)} km van verkoper
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-4">
                        <span>Naar verkoper: {deliverer.distanceToSeller.toFixed(1)} km</span>
                        {deliverer.distanceToBuyer > 0 && (
                          <span>Naar jou: {deliverer.distanceToBuyer.toFixed(1)} km</span>
                        )}
                        <span className="font-medium text-green-600">
                          Totaal: {deliverer.totalDeliveryDistance.toFixed(1)} km
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="mt-2 text-xs text-gray-500">
                    {deliverer.completedDeliveries} bezorgingen voltooid
                  </div>
                </div>
              </div>

              {/* Estimated Time */}
              <div className="text-right">
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    {deliverer.totalDeliveryDistance < 5 ? '~30 min' :
                     deliverer.totalDeliveryDistance < 15 ? '~1 uur' :
                     deliverer.totalDeliveryDistance < 30 ? '~1.5 uur' : '~2 uur'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          {regionInfo?.isCaribbean ? (
            <>
              🏝️ <strong>Eiland bezorging:</strong> Bezorgers werken alleen op hetzelfde eiland. 
              Afstand is minder belangrijk omdat eilanden klein zijn. 
              Bezorgers worden gerangschikt op basis van hun beoordeling en ervaring.
            </>
          ) : (
            <>
              💡 <strong>Afstand bezorging:</strong> Bezorgers worden geselecteerd op basis van hun locatie en bezorgradius. 
              De geschatte tijd is gebaseerd op de totale afstand.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
