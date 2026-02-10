'use client';

import { useState, useEffect } from 'react';
import { Truck, MapPin, Users, Save, AlertCircle, CheckCircle, Navigation, Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SellerDeliverySettingsProps {
  sellerProfileId: string;
  initialSettings?: {
    deliveryMode: string;
    deliveryRadius: number;
    deliveryRegions: string[];
  };
}

export default function SellerDeliverySettings({ 
  sellerProfileId, 
  initialSettings 
}: SellerDeliverySettingsProps) {
  const [deliveryMode, setDeliveryMode] = useState(initialSettings?.deliveryMode || 'PLATFORM_DELIVERERS');
  const [deliveryRadius, setDeliveryRadius] = useState(initialSettings?.deliveryRadius || 5.0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deliveryModes = [
    {
      id: 'SELLER_DELIVERY',
      name: 'Ik bezorg zelf',
      description: 'Je bezorgt zelf binnen jouw ingestelde straal',
      icon: <Truck className="w-6 h-6" />,
      color: 'blue',
      features: [
        '✓ Controle over bezorgtijden',
        '✓ Direct contact met klant',
        '✓ Eigen bezorgkosten bepalen',
        '✓ Vast gebied rondom je locatie'
      ]
    },
    {
      id: 'PLATFORM_DELIVERERS',
      name: 'Via bezorgers',
      description: 'Gebruik onze bezorgers voor flexibele bezorging',
      icon: <Users className="w-6 h-6" />,
      color: 'green',
      features: [
        '✓ Automatische bezorger matching',
        '✓ Grotere bezorgradius mogelijk',
        '✓ Afhankelijk van bezorger beschikbaarheid',
        '✓ GPS-gebaseerde selectie'
      ]
    },
    {
      id: 'BOTH',
      name: 'Beide opties',
      description: 'Klanten kunnen kiezen tussen jouw bezorging of bezorgers',
      icon: <Package className="w-6 h-6" />,
      color: 'purple',
      features: [
        '✓ Maximale flexibiliteit',
        '✓ Meer bezorgmogelijkheden',
        '✓ Eigen straal + bezorgers',
        '✓ Hogere verkoopcijfers'
      ]
    }
  ];

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/seller/delivery-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerProfileId,
          deliveryMode,
          deliveryRadius: deliveryMode === 'SELLER_DELIVERY' || deliveryMode === 'BOTH' ? deliveryRadius : null
        })
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Er is een fout opgetreden');
      }
    } catch (err) {
      console.error('Error saving delivery settings:', err);
      setError('Er is een fout opgetreden bij het opslaan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bezorginstellingen</h2>
        <p className="text-gray-600">
          Stel in hoe je producten wilt bezorgen aan klanten
        </p>
      </div>

      {/* Delivery Mode Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bezorgmodus</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {deliveryModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setDeliveryMode(mode.id)}
              className={`p-6 rounded-2xl border-2 transition-all text-left ${
                deliveryMode === mode.id
                  ? `border-${mode.color}-500 bg-${mode.color}-50`
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-xl ${
                  deliveryMode === mode.id 
                    ? `bg-${mode.color}-500 text-white` 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {mode.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{mode.name}</h4>
                  <p className="text-sm text-gray-600">{mode.description}</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                {mode.features.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </div>

      {/* Delivery Radius (only for SELLER_DELIVERY or BOTH) */}
      {(deliveryMode === 'SELLER_DELIVERY' || deliveryMode === 'BOTH') && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-500 rounded-xl">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Jouw Bezorgstraal</h3>
              <p className="text-sm text-gray-600">Hoever wil je zelf bezorgen?</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={deliveryRadius}
                onChange={(e) => setDeliveryRadius(parseFloat(e.target.value))}
                className="w-full h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between mt-2 text-sm text-gray-600">
                <span>1 km</span>
                <span className="font-bold text-3xl text-blue-600">{deliveryRadius} km</span>
                <span>100 km</span>
              </div>
              <div className="mt-2 text-center">
                <p className="text-xs text-gray-500">
                  {deliveryRadius <= 10 && '🚴 Perfect voor lokale bezorging'}
                  {deliveryRadius > 10 && deliveryRadius <= 30 && '🚗 Geschikt voor regionale bezorging'}
                  {deliveryRadius > 30 && deliveryRadius <= 60 && '🚙 Voor bezorging in meerdere steden'}
                  {deliveryRadius > 60 && '✈️ Landelijke bezorging mogelijk'}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-blue-200">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Hoe werkt dit?</strong>
              </p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>📍 Je bezorgt alleen binnen {deliveryRadius}km van je locatie</li>
                <li>💰 Je bepaalt zelf de bezorgkosten per bestelling</li>
                <li>🚗 Je gebruikt je eigen vervoer en planning</li>
                <li>⏰ Je bepaalt zelf wanneer je beschikbaar bent</li>
                {deliveryRadius > 50 && (
                  <li className="text-purple-700 font-medium">
                    🎨 Perfect voor unieke kunst/design items waarbij persoonlijke aflevering belangrijk is
                  </li>
                )}
              </ul>
            </div>

            {deliveryRadius > 30 && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
                <p className="text-sm text-purple-900 font-semibold mb-2">
                  🎨 Grote afstand geselecteerd
                </p>
                <p className="text-xs text-purple-700">
                  Ideaal voor designers en kunstenaars! Veel makers willen hun creaties persoonlijk 
                  afleveren, uitleggen en de waarde ervan overbrengen. Rijd gerust het hele land door 
                  voor je bijzondere stukken!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Platform Deliverers Info */}
      {(deliveryMode === 'PLATFORM_DELIVERERS' || deliveryMode === 'BOTH') && (
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-500 rounded-xl">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Platform Bezorgers</h3>
              <p className="text-sm text-gray-600">Hoe werkt bezorging via ons platform?</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-green-200">
            <p className="text-sm text-gray-700 mb-3">
              <strong>Automatische matching:</strong>
            </p>
            <ul className="text-xs text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">1.</span>
                <span>Klant bestelt een product en kiest voor bezorging</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">2.</span>
                <span>Systeem zoekt bezorgers binnen straal van jouw locatie én klant</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">3.</span>
                <span>Bezorger accepteert en haalt product bij jou op</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">4.</span>
                <span>Bezorger brengt product naar klant</span>
              </li>
            </ul>

            <div className="mt-4 p-3 bg-green-100 rounded-lg">
              <p className="text-xs text-green-800">
                <strong>💡 Let op:</strong> Bezorging is alleen mogelijk als er bezorgers beschikbaar zijn 
                in het gebied. Klanten zien alleen de bezorgoptie als er bezorgers binnen bereik zijn.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="text-sm text-gray-600">
          {deliveryMode === 'SELLER_DELIVERY' && (
            <p>Je bezorgt zelf binnen {deliveryRadius}km</p>
          )}
          {deliveryMode === 'PLATFORM_DELIVERERS' && (
            <p>Bezorging via platform bezorgers (afhankelijk van beschikbaarheid)</p>
          )}
          {deliveryMode === 'BOTH' && (
            <p>Beide opties: zelf binnen {deliveryRadius}km + platform bezorgers</p>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Opslaan...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Opslaan
            </>
          )}
        </Button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom">
          <CheckCircle className="w-5 h-5" />
          Bezorginstellingen opgeslagen!
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Fout bij opslaan</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}

