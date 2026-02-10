'use client';

import { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, MessageSquare, Clock, ToggleLeft, ToggleRight, Save, Loader2, HelpCircle, X } from 'lucide-react';
import HelpSettings from '@/components/onboarding/HelpSettings';
import { useTranslation } from '@/hooks/useTranslation';

interface NotificationSettingsProps {
  onUpdateSettings: (settings: any) => Promise<void>;
}

export default function NotificationSettings({ onUpdateSettings }: NotificationSettingsProps) {
  const { t } = useTranslation();
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

      setSaveMessage(t('notificationSettings.settingsSaved'));
      await onUpdateSettings(settings);
      
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage(t('notificationSettings.errorSaving'));
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
            <h2 className="text-xl font-semibold text-gray-900">{t('notificationSettings.title')}</h2>
            <p className="text-sm text-gray-500">{t('notificationSettings.subtitle')}</p>
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
              {t('notificationSettings.saving')}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {t('notificationSettings.save')}
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
          <h3 className="text-lg font-medium text-gray-900">{t('notificationSettings.emailNotifications')}</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{t('notificationSettings.newMessages')}</h4>
              <p className="text-sm text-gray-500">{t('notificationSettings.newMessagesEmail')}</p>
            </div>
            <ToggleButton
              enabled={settings.emailNewMessages}
              onClick={() => handleToggle('emailNewMessages')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{t('notificationSettings.newOrders')}</h4>
              <p className="text-sm text-gray-500">{t('notificationSettings.newOrdersEmail')}</p>
            </div>
            <ToggleButton
              enabled={settings.emailNewOrders}
              onClick={() => handleToggle('emailNewOrders')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{t('notificationSettings.orderUpdates')}</h4>
              <p className="text-sm text-gray-500">{t('notificationSettings.orderUpdatesEmail')}</p>
            </div>
            <ToggleButton
              enabled={settings.emailOrderUpdates}
              onClick={() => handleToggle('emailOrderUpdates')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{t('notificationSettings.deliveryUpdates')}</h4>
              <p className="text-sm text-gray-500">{t('notificationSettings.deliveryUpdatesEmail')}</p>
            </div>
            <ToggleButton
              enabled={settings.emailDeliveryUpdates}
              onClick={() => handleToggle('emailDeliveryUpdates')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{t('notificationSettings.marketing')}</h4>
              <p className="text-sm text-gray-500">{t('notificationSettings.marketingEmail')}</p>
            </div>
            <ToggleButton
              enabled={settings.emailMarketing}
              onClick={() => handleToggle('emailMarketing')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{t('notificationSettings.weeklyDigest')}</h4>
              <p className="text-sm text-gray-500">{t('notificationSettings.weeklyDigestEmail')}</p>
            </div>
            <ToggleButton
              enabled={settings.emailWeeklyDigest}
              onClick={() => handleToggle('emailWeeklyDigest')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{t('notificationSettings.securityAlerts')}</h4>
              <p className="text-sm text-gray-500">{t('notificationSettings.securityAlertsEmail')}</p>
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
          <h3 className="text-lg font-medium text-gray-900">{t('notificationSettings.pushNotifications')}</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{t('notificationSettings.newMessages')}</h4>
              <p className="text-sm text-gray-500">{t('notificationSettings.newMessagesPush')}</p>
            </div>
            <ToggleButton
              enabled={settings.pushNewMessages}
              onClick={() => handleToggle('pushNewMessages')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{t('notificationSettings.newOrders')}</h4>
              <p className="text-sm text-gray-500">{t('notificationSettings.newOrdersPush')}</p>
            </div>
            <ToggleButton
              enabled={settings.pushNewOrders}
              onClick={() => handleToggle('pushNewOrders')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{t('notificationSettings.orderUpdates')}</h4>
              <p className="text-sm text-gray-500">{t('notificationSettings.orderUpdatesPush')}</p>
            </div>
            <ToggleButton
              enabled={settings.pushOrderUpdates}
              onClick={() => handleToggle('pushOrderUpdates')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{t('notificationSettings.deliveryUpdates')}</h4>
              <p className="text-sm text-gray-500">{t('notificationSettings.deliveryUpdatesPush')}</p>
            </div>
            <ToggleButton
              enabled={settings.pushDeliveryUpdates}
              onClick={() => handleToggle('pushDeliveryUpdates')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{t('notificationSettings.nearbyProducts')}</h4>
              <p className="text-sm text-gray-500">{t('notificationSettings.nearbyProductsPush')}</p>
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
          <h3 className="text-lg font-medium text-gray-900">{t('notificationSettings.smsNotifications')}</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {t('notificationSettings.smsNote')}
        </p>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{t('notificationSettings.orderUpdates')}</h4>
              <p className="text-sm text-gray-500">{t('notificationSettings.orderUpdatesSms')}</p>
            </div>
            <ToggleButton
              enabled={settings.smsOrderUpdates}
              onClick={() => handleToggle('smsOrderUpdates')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{t('notificationSettings.deliveryUpdates')}</h4>
              <p className="text-sm text-gray-500">{t('notificationSettings.deliveryUpdatesSms')}</p>
            </div>
            <ToggleButton
              enabled={settings.smsDeliveryUpdates}
              onClick={() => handleToggle('smsDeliveryUpdates')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{t('notificationSettings.securityAlerts')}</h4>
              <p className="text-sm text-gray-500">{t('notificationSettings.securityAlertsSms')}</p>
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
          <h3 className="text-lg font-medium text-gray-900">{t('notificationSettings.chatSettings')}</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{t('notificationSettings.soundEnabled')}</h4>
              <p className="text-sm text-gray-500">{t('notificationSettings.soundEnabledDescription')}</p>
            </div>
            <ToggleButton
              enabled={settings.chatSoundEnabled}
              onClick={() => handleToggle('chatSoundEnabled')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{t('notificationSettings.messagePreview')}</h4>
              <p className="text-sm text-gray-500">{t('notificationSettings.messagePreviewDescription')}</p>
            </div>
            <ToggleButton
              enabled={settings.chatNotificationPreview}
              onClick={() => handleToggle('chatNotificationPreview')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{t('notificationSettings.groupMentionsOnly')}</h4>
              <p className="text-sm text-gray-500">{t('notificationSettings.groupMentionsOnlyDescription')}</p>
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
          <h3 className="text-lg font-medium text-gray-900">{t('notificationSettings.quietHours')}</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {t('notificationSettings.quietHoursDescription')}
        </p>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{t('notificationSettings.enableQuietHours')}</h4>
              <p className="text-sm text-gray-500">{t('notificationSettings.enableQuietHoursDescription')}</p>
            </div>
            <ToggleButton
              enabled={settings.quietHoursEnabled}
              onClick={() => handleToggle('quietHoursEnabled')}
            />
          </div>

          {settings.quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4 pl-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('notificationSettings.startTime')}</label>
                <input
                  type="time"
                  value={settings.quietHoursStart || '22:00'}
                  onChange={(e) => setSettings({ ...settings, quietHoursStart: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('notificationSettings.endTime')}</label>
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
              {t('common.saving')}
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {t('notificationSettings.saveSettings')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
