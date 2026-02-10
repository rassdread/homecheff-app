'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  RefreshCw,
  DollarSign,
  Truck,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Key,
  Shield,
  Info
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface Subscription {
  id: string;
  name: string;
  priceCents: number;
  feeBps: number;
  durationDays: number;
}

interface SettingsData {
  subscriptions: Subscription[];
  deliverySettings: {
    platformDeliverers: {
      baseFee: number;
      perKmRate: number;
      freeDistanceKm: number;
      platformCut: number;
    };
    sellerDelivery: {
      baseFee: number;
      perKmRate: number;
      freeDistanceKm: number;
      platformCut: number;
    };
  };
  defaultPlatformFee: number;
  stripeFee: {
    percentage: number;
    fixed: number;
  };
  stripeConfig?: {
    isConfigured: boolean;
    mode: 'live' | 'test' | 'unknown';
    hasSecretKey: boolean;
    hasPublishableKey: boolean;
    secretKeyPrefix: string;
    secretKeyType?: 'live' | 'test' | 'unknown' | 'none';
    publishableKeyPrefix: string;
    publishableKeyType?: 'live' | 'test' | 'unknown' | 'none';
    webhookSecret: string;
    connectClientId: string;
  };
}

export default function PlatformSettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setMessage(null);

    try {
      // Save subscription fees
      for (const sub of settings.subscriptions) {
        await fetch('/api/admin/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscriptionId: sub.id,
            feeBps: sub.feeBps,
            priceCents: sub.priceCents
          })
        });
      }

      setMessage({ type: 'success', text: t('admin.settingsSavedSuccess') });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: t('admin.errorSavingSettings') });
    } finally {
      setSaving(false);
    }
  };

  const updateSubscription = (id: string, field: 'feeBps' | 'priceCents', value: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      subscriptions: settings.subscriptions.map(sub =>
        sub.id === id ? { ...sub, [field]: value } : sub
      )
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
      </div>
    );
  }

  if (!settings) {
    return <div className="text-center py-12 text-gray-600">Geen instellingen gevonden</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Platform Instellingen</h2>
          <p className="text-gray-600">Beheer platform fees en configuratie</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Opslaan...' : 'Opslaan'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Subscription Fees */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Abonnement Fees
        </h3>
        <div className="space-y-4">
          {settings.subscriptions.map((sub) => (
            <div key={sub.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">{sub.name}</h4>
                <span className="text-sm text-gray-500">{sub.durationDays} dagen</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform Fee (%)
                  </label>
                  <input
                    type="number"
                    value={sub.feeBps / 100}
                    onChange={(e) => updateSubscription(sub.id, 'feeBps', parseFloat(e.target.value) * 100)}
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prijs (€)
                  </label>
                  <input
                    type="number"
                    value={sub.priceCents / 100}
                    onChange={(e) => updateSubscription(sub.id, 'priceCents', parseFloat(e.target.value) * 100)}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Settings (Read-only for now) */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Bezorgkosten Configuratie
        </h3>
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Platform Bezorgers</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Basis fee:</span>
                <span className="ml-2 font-medium">€{(settings.deliverySettings.platformDeliverers.baseFee / 100).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Per km:</span>
                <span className="ml-2 font-medium">€{(settings.deliverySettings.platformDeliverers.perKmRate / 100).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Gratis afstand:</span>
                <span className="ml-2 font-medium">{settings.deliverySettings.platformDeliverers.freeDistanceKm} km</span>
              </div>
              <div>
                <span className="text-gray-600">Platform cut:</span>
                <span className="ml-2 font-medium">{settings.deliverySettings.platformDeliverers.platformCut}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Default Platform Fee */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Standaard Platform Fee
        </h3>
        <div className="text-sm text-gray-600">
          <p>Individuele verkopers: <span className="font-medium">{settings.defaultPlatformFee}%</span></p>
          <p className="mt-2">Stripe fee: <span className="font-medium">{settings.stripeFee.percentage}% + €{(settings.stripeFee.fixed / 100).toFixed(2)}</span></p>
        </div>
      </div>

      {/* Stripe Configuration */}
      {settings.stripeConfig && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Key className="w-5 h-5" />
            Stripe Configuratie
          </h3>
          
          {/* Status Badge */}
          <div className="mb-6">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
              settings.stripeConfig.mode === 'live' 
                ? 'bg-green-100 text-green-800 border border-green-300' 
                : settings.stripeConfig.mode === 'test'
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                : 'bg-gray-100 text-gray-800 border border-gray-300'
            }`}>
              {settings.stripeConfig.mode === 'live' ? (
                <>
                  <Shield className="w-4 h-4" />
                  <span>LIVE MODE - Echte betalingen actief</span>
                </>
              ) : settings.stripeConfig.mode === 'test' ? (
                <>
                  <AlertCircle className="w-4 h-4" />
                  <span>TEST MODE - Geen echte betalingen</span>
                </>
              ) : (
                <>
                  <Info className="w-4 h-4" />
                  <span>Status onbekend</span>
                </>
              )}
            </div>
          </div>

          {/* Configuration Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Secret Key</span>
                  <div className="flex items-center gap-2">
                    {settings.stripeConfig.secretKeyType === 'live' && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded font-semibold">LIVE</span>
                    )}
                    {settings.stripeConfig.secretKeyType === 'test' && (
                      <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded font-semibold">TEST</span>
                    )}
                    {settings.stripeConfig.hasSecretKey ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-600 font-mono">{settings.stripeConfig.secretKeyPrefix}</p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Publishable Key</span>
                  <div className="flex items-center gap-2">
                    {settings.stripeConfig.publishableKeyType === 'live' && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded font-semibold">LIVE</span>
                    )}
                    {settings.stripeConfig.publishableKeyType === 'test' && (
                      <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded font-semibold">TEST</span>
                    )}
                    {settings.stripeConfig.hasPublishableKey ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-600 font-mono">{settings.stripeConfig.publishableKeyPrefix}</p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Webhook Secret</span>
                  {settings.stripeConfig.webhookSecret === 'Ingesteld' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  )}
                </div>
                <p className="text-xs text-gray-600">{settings.stripeConfig.webhookSecret}</p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Connect Client ID</span>
                  {settings.stripeConfig.connectClientId === 'Ingesteld' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  )}
                </div>
                <p className="text-xs text-gray-600">{settings.stripeConfig.connectClientId}</p>
              </div>
            </div>

            {/* Instructions for Live Mode */}
            {settings.stripeConfig.mode === 'test' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-2">Overstappen naar Live Mode</h4>
                    <p className="text-sm text-blue-800 mb-3">
                      Om echte betalingen te accepteren, moet je de Stripe live keys instellen in je environment variabelen:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                      <li>Ga naar je Stripe Dashboard → Developers → API Keys</li>
                      <li>Kopieer je <strong>Live</strong> keys (niet test keys)</li>
                      <li>Update in Vercel: Settings → Environment Variables</li>
                      <li>Zet <code className="bg-blue-100 px-1 rounded">STRIPE_SECRET_KEY</code> naar <code className="bg-blue-100 px-1 rounded">sk_live_...</code></li>
                      <li>Zet <code className="bg-blue-100 px-1 rounded">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> naar <code className="bg-blue-100 px-1 rounded">pk_live_...</code></li>
                      <li>Herstart de applicatie na het wijzigen</li>
                    </ol>
                    <p className="text-xs text-blue-700 mt-3 font-medium">
                      ⚠️ Let op: Live mode betekent dat echte betalingen worden verwerkt!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {settings.stripeConfig.mode === 'live' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-900 mb-2">Live Mode Actief</h4>
                    <p className="text-sm text-green-800">
                      Je Stripe configuratie is ingesteld voor live betalingen. Alle transacties worden verwerkt als echte betalingen.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}




