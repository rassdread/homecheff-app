'use client';

import { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, MessageSquare, Clock, ToggleLeft, ToggleRight, Save, Loader2, HelpCircle, X } from 'lucide-react';
import HelpSettings from '@/components/onboarding/HelpSettings';

interface NotificationSettingsProps {
  onUpdateSettings: (settings: any) => Promise<void>;
}

export default function NotificationSettings({ onUpdateSettings }: NotificationSettingsProps) {
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Load settings from API
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/notifications/preferences');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.preferences);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (field: string) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      [field]: !settings[field]
    });
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSaveMessage('✅ Instellingen opgeslagen!');
      await onUpdateSettings(settings);
      
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage('❌ Fout bij opslaan');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const ToggleButton = ({ enabled, onClick, disabled }: { enabled: boolean; onClick: () => void; disabled?: boolean }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-emerald-600' : 'bg-gray-200'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Bell className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Notificatie-instellingen</h2>
            <p className="text-sm text-gray-500">Kies welke meldingen je wilt ontvangen en hoe</p>
          </div>
        </div>
        
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Opslaan...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Opslaan
            </>
          )}
        </button>
      </div>

      {saveMessage && (
        <div className={`p-3 rounded-lg ${saveMessage.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {saveMessage}
        </div>
      )}

      {/* Help & Uitleg - BOVENAAN */}
      <HelpSettings />

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
              <p className="text-sm text-gray-500">Ontvang een email bij nieuwe chat berichten</p>
            </div>
            <ToggleButton
              enabled={settings.emailNewMessages}
              onClick={() => handleToggle('emailNewMessages')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Nieuwe bestellingen</h4>
              <p className="text-sm text-gray-500">Ontvang een email bij nieuwe bestellingen</p>
            </div>
            <ToggleButton
              enabled={settings.emailNewOrders}
              onClick={() => handleToggle('emailNewOrders')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Bestelling updates</h4>
              <p className="text-sm text-gray-500">Ontvang updates over je bestellingen</p>
            </div>
            <ToggleButton
              enabled={settings.emailOrderUpdates}
              onClick={() => handleToggle('emailOrderUpdates')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Bezorging updates</h4>
              <p className="text-sm text-gray-500">Ontvang updates over bezorgingen</p>
            </div>
            <ToggleButton
              enabled={settings.emailDeliveryUpdates}
              onClick={() => handleToggle('emailDeliveryUpdates')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Marketing emails</h4>
              <p className="text-sm text-gray-500">Ontvang promoties en nieuws</p>
            </div>
            <ToggleButton
              enabled={settings.emailMarketing}
              onClick={() => handleToggle('emailMarketing')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Wekelijkse samenvatting</h4>
              <p className="text-sm text-gray-500">Ontvang een wekelijkse samenvatting van je activiteit</p>
            </div>
            <ToggleButton
              enabled={settings.emailWeeklyDigest}
              onClick={() => handleToggle('emailWeeklyDigest')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Beveiligingswaarschuwingen</h4>
              <p className="text-sm text-gray-500">Belangrijke account beveiligingsmeldingen</p>
            </div>
            <ToggleButton
              enabled={settings.emailSecurityAlerts}
              onClick={() => handleToggle('emailSecurityAlerts')}
              disabled={true}
            />
          </div>
        </div>
      </div>

      {/* Push Notifications */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Smartphone className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Push notificaties (In-app)</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Nieuwe berichten</h4>
              <p className="text-sm text-gray-500">Ontvang push notificaties bij nieuwe berichten</p>
            </div>
            <ToggleButton
              enabled={settings.pushNewMessages}
              onClick={() => handleToggle('pushNewMessages')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Nieuwe bestellingen</h4>
              <p className="text-sm text-gray-500">Ontvang push notificaties bij nieuwe bestellingen</p>
            </div>
            <ToggleButton
              enabled={settings.pushNewOrders}
              onClick={() => handleToggle('pushNewOrders')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Bestelling updates</h4>
              <p className="text-sm text-gray-500">Ontvang push notificaties bij bestelling updates</p>
            </div>
            <ToggleButton
              enabled={settings.pushOrderUpdates}
              onClick={() => handleToggle('pushOrderUpdates')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Bezorging updates</h4>
              <p className="text-sm text-gray-500">Updates over bezorgingen</p>
            </div>
            <ToggleButton
              enabled={settings.pushDeliveryUpdates}
              onClick={() => handleToggle('pushDeliveryUpdates')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Nabijgelegen producten</h4>
              <p className="text-sm text-gray-500">Ontvang notificaties over producten in je buurt</p>
            </div>
            <ToggleButton
              enabled={settings.pushNearbyProducts}
              onClick={() => handleToggle('pushNearbyProducts')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Beveiligingswaarschuwingen</h4>
              <p className="text-sm text-gray-500">Belangrijke beveiligingsmeldingen</p>
            </div>
            <ToggleButton
              enabled={settings.pushSecurityAlerts}
              onClick={() => handleToggle('pushSecurityAlerts')}
              disabled={true}
            />
          </div>
        </div>
      </div>

      {/* SMS Notifications */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <MessageSquare className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">SMS notificaties</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          💡 SMS notificaties worden alleen verstuurd voor belangrijke updates
        </p>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Bestelling updates</h4>
              <p className="text-sm text-gray-500">Ontvang SMS bij belangrijke bestelling updates</p>
            </div>
            <ToggleButton
              enabled={settings.smsOrderUpdates}
              onClick={() => handleToggle('smsOrderUpdates')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Bezorging updates</h4>
              <p className="text-sm text-gray-500">SMS bij belangrijke bezorgingsupdates</p>
            </div>
            <ToggleButton
              enabled={settings.smsDeliveryUpdates}
              onClick={() => handleToggle('smsDeliveryUpdates')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Beveiligingswaarschuwingen</h4>
              <p className="text-sm text-gray-500">SMS bij beveiligingsgerelateerde gebeurtenissen</p>
            </div>
            <ToggleButton
              enabled={settings.smsSecurityAlerts}
              onClick={() => handleToggle('smsSecurityAlerts')}
              disabled={true}
            />
          </div>
        </div>
      </div>

      {/* Chat Settings */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <MessageSquare className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Chat instellingen</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Geluid inschakelen</h4>
              <p className="text-sm text-gray-500">Speel een geluid af bij nieuwe berichten</p>
            </div>
            <ToggleButton
              enabled={settings.chatSoundEnabled}
              onClick={() => handleToggle('chatSoundEnabled')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Berichtvoorbeeld tonen</h4>
              <p className="text-sm text-gray-500">Toon een preview van het bericht in notificaties</p>
            </div>
            <ToggleButton
              enabled={settings.chatNotificationPreview}
              onClick={() => handleToggle('chatNotificationPreview')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Alleen vermeldingen in groepen</h4>
              <p className="text-sm text-gray-500">Ontvang alleen notificaties bij @vermeldingen in groepschats</p>
            </div>
            <ToggleButton
              enabled={settings.chatGroupMentionsOnly}
              onClick={() => handleToggle('chatGroupMentionsOnly')}
            />
          </div>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Clock className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Stille uren</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          💤 Ontvang geen notificaties tijdens stille uren (belangrijke beveiligingsmeldingen worden wel verzonden)
        </p>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Stille uren inschakelen</h4>
              <p className="text-sm text-gray-500">Schakel notificaties uit tijdens specifieke uren</p>
            </div>
            <ToggleButton
              enabled={settings.quietHoursEnabled}
              onClick={() => handleToggle('quietHoursEnabled')}
            />
          </div>

          {settings.quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4 pl-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start tijd</label>
                <input
                  type="time"
                  value={settings.quietHoursStart || '22:00'}
                  onChange={(e) => setSettings({ ...settings, quietHoursStart: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Eind tijd</label>
                <input
                  type="time"
                  value={settings.quietHoursEnd || '08:00'}
                  onChange={(e) => setSettings({ ...settings, quietHoursEnd: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save button at bottom */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors font-medium"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Opslaan...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Instellingen opslaan
            </>
          )}
        </button>
      </div>
    </div>
  );
}
