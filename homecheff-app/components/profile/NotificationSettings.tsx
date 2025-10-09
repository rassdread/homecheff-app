'use client';

import { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, ToggleLeft, ToggleRight } from 'lucide-react';

interface NotificationSettingsProps {
  onUpdateSettings: (settings: any) => Promise<void>;
}

export default function NotificationSettings({ onUpdateSettings }: NotificationSettingsProps) {
  const [settings, setSettings] = useState({
    email: {
      newMessages: true,
      newOrders: true,
      orderUpdates: true,
      marketing: false,
      weeklyDigest: true
    },
    push: {
      newMessages: true,
      newOrders: true,
      orderUpdates: true,
      nearbyProducts: false
    },
    sms: {
      orderUpdates: false,
      securityAlerts: true
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);

  const handleToggle = async (category: string, setting: string) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category as keyof typeof settings],
        [setting]: !(settings[category as keyof typeof settings] as any)[setting]
      }
    };
    
    setSettings(newSettings);
    
    setIsLoading(true);
    try {
      await onUpdateSettings(newSettings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      // Revert on error
      setSettings(settings);
    } finally {
      setIsLoading(false);
    }
  };

  const ToggleButton = ({ enabled, onClick }: { enabled: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-emerald-600' : 'bg-gray-200'
      } disabled:opacity-50`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <Bell className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Notificatie-instellingen</h2>
          <p className="text-sm text-gray-500">Kies welke meldingen je wilt ontvangen</p>
        </div>
      </div>

      {/* Email Notifications */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Mail className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Email notificaties</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Nieuwe berichten</h4>
              <p className="text-sm text-gray-500">Ontvang een email bij nieuwe berichten</p>
            </div>
            <ToggleButton
              enabled={settings.email.newMessages}
              onClick={() => handleToggle('email', 'newMessages')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Nieuwe bestellingen</h4>
              <p className="text-sm text-gray-500">Ontvang een email bij nieuwe bestellingen</p>
            </div>
            <ToggleButton
              enabled={settings.email.newOrders}
              onClick={() => handleToggle('email', 'newOrders')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Bestelling updates</h4>
              <p className="text-sm text-gray-500">Ontvang updates over je bestellingen</p>
            </div>
            <ToggleButton
              enabled={settings.email.orderUpdates}
              onClick={() => handleToggle('email', 'orderUpdates')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Marketing emails</h4>
              <p className="text-sm text-gray-500">Ontvang promoties en nieuws</p>
            </div>
            <ToggleButton
              enabled={settings.email.marketing}
              onClick={() => handleToggle('email', 'marketing')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Wekelijkse samenvatting</h4>
              <p className="text-sm text-gray-500">Ontvang een wekelijkse samenvatting van je activiteit</p>
            </div>
            <ToggleButton
              enabled={settings.email.weeklyDigest}
              onClick={() => handleToggle('email', 'weeklyDigest')}
            />
          </div>
        </div>
      </div>

      {/* Push Notifications */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Smartphone className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Push notificaties</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Nieuwe berichten</h4>
              <p className="text-sm text-gray-500">Ontvang push notificaties bij nieuwe berichten</p>
            </div>
            <ToggleButton
              enabled={settings.push.newMessages}
              onClick={() => handleToggle('push', 'newMessages')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Nieuwe bestellingen</h4>
              <p className="text-sm text-gray-500">Ontvang push notificaties bij nieuwe bestellingen</p>
            </div>
            <ToggleButton
              enabled={settings.push.newOrders}
              onClick={() => handleToggle('push', 'newOrders')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Bestelling updates</h4>
              <p className="text-sm text-gray-500">Ontvang push notificaties bij bestelling updates</p>
            </div>
            <ToggleButton
              enabled={settings.push.orderUpdates}
              onClick={() => handleToggle('push', 'orderUpdates')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Nabijgelegen producten</h4>
              <p className="text-sm text-gray-500">Ontvang notificaties over producten in je buurt</p>
            </div>
            <ToggleButton
              enabled={settings.push.nearbyProducts}
              onClick={() => handleToggle('push', 'nearbyProducts')}
            />
          </div>
        </div>
      </div>

      {/* SMS Notifications */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Smartphone className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">SMS notificaties</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Bestelling updates</h4>
              <p className="text-sm text-gray-500">Ontvang SMS bij belangrijke bestelling updates</p>
            </div>
            <ToggleButton
              enabled={settings.sms.orderUpdates}
              onClick={() => handleToggle('sms', 'orderUpdates')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Beveiligingswaarschuwingen</h4>
              <p className="text-sm text-gray-500">Ontvang SMS bij beveiligingsgerelateerde gebeurtenissen</p>
            </div>
            <ToggleButton
              enabled={settings.sms.securityAlerts}
              onClick={() => handleToggle('sms', 'securityAlerts')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

