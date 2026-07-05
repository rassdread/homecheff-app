'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Shield, Eye, EyeOff, MessageCircle, Users,
  Save, AlertCircle, Check, ArrowLeft, Trash2
} from 'lucide-react';
import HelpSettings from '@/components/onboarding/HelpSettings';
import { useTranslation } from '@/hooks/useTranslation';

interface PrivacySettings {
  messagePrivacy: 'NOBODY' | 'FANS_ONLY' | 'EVERYONE';
  showFansList: boolean;
  showProfileToEveryone: boolean;
  showOnlineStatus: boolean;
}

interface PrivacySettingsProps {
  onClose?: () => void;
  /** When true: hide standalone page chrome (used in /settings hub). */
  embedded?: boolean;
}

function pickVisibleSettings(raw: Record<string, unknown>): PrivacySettings {
  return {
    messagePrivacy:
      raw.messagePrivacy === 'NOBODY' || raw.messagePrivacy === 'FANS_ONLY'
        ? raw.messagePrivacy
        : 'EVERYONE',
    showFansList: raw.showFansList !== false,
    showProfileToEveryone: raw.showProfileToEveryone !== false,
    showOnlineStatus: raw.showOnlineStatus !== false,
  };
}

export default function PrivacySettings({ onClose, embedded = false }: PrivacySettingsProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [settings, setSettings] = useState<PrivacySettings>({
    messagePrivacy: 'EVERYONE',
    showFansList: true,
    showProfileToEveryone: true,
    showOnlineStatus: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      if (!(session as { user?: { id?: string } })?.user?.id) return;

      setLoading(true);
      try {
        const response = await fetch('/api/profile/privacy');
        if (response.ok) {
          const data = await response.json();
          setSettings(pickVisibleSettings(data.settings ?? {}));
        }
      } catch (error) {
        console.error('Error loading privacy settings:', error);
        setMessage({ type: 'error', text: t('privacySettingsPage.loadError') });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [session, t]);

  const handleSave = async () => {
    if (!(session as { user?: { id?: string } })?.user?.id) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/profile/privacy', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: t('privacySettingsPage.saveSuccess') });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      setMessage({ type: 'error', text: t('privacySettingsPage.saveError') });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const messagePrivacyOptions = [
    {
      value: 'EVERYONE' as const,
      label: t('privacySettingsPage.messagePrivacy.everyone.label'),
      desc: t('privacySettingsPage.messagePrivacy.everyone.desc'),
    },
    {
      value: 'FANS_ONLY' as const,
      label: t('privacySettingsPage.messagePrivacy.fansOnly.label'),
      desc: t('privacySettingsPage.messagePrivacy.fansOnly.desc'),
    },
    {
      value: 'NOBODY' as const,
      label: t('privacySettingsPage.messagePrivacy.nobody.label'),
      desc: t('privacySettingsPage.messagePrivacy.nobody.desc'),
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? '' : 'bg-white rounded-lg shadow-sm border border-gray-200'}>
      {!embedded && (
        <div className="px-6 pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('privacySettingsPage.backToHome')}</span>
          </Link>
        </div>
      )}

      {!embedded && (
        <div className="flex items-center justify-between px-6 pt-2 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t('privacySettingsPage.title')}</h2>
              <p className="text-sm text-gray-600">{t('privacySettingsPage.subtitle')}</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <EyeOff className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
      )}

      {!embedded && (
        <div className="px-6 pt-4">
          <HelpSettings />
        </div>
      )}

      <div className={`space-y-6 ${embedded ? '' : 'p-6'}`}>
        {/* Message Privacy */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">{t('privacySettingsPage.messagePrivacy.heading')}</h3>
          </div>
          <p className="text-sm text-gray-600">{t('privacySettingsPage.messagePrivacy.description')}</p>
          <div className="space-y-2">
            {messagePrivacyOptions.map(option => (
              <label key={option.value} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="messagePrivacy"
                  value={option.value}
                  checked={settings.messagePrivacy === option.value}
                  onChange={(e) => updateSetting('messagePrivacy', e.target.value as PrivacySettings['messagePrivacy'])}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Fan list visibility */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">{t('privacySettingsPage.fansSection.heading')}</h3>
          </div>

          <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex-1 pr-4">
              <div className="font-medium text-gray-900">{t('privacySettingsPage.fansSection.showFansList.label')}</div>
              <div className="text-sm text-gray-600">{t('privacySettingsPage.fansSection.showFansList.desc')}</div>
            </div>
            <input
              type="checkbox"
              checked={settings.showFansList}
              onChange={(e) => updateSetting('showFansList', e.target.checked)}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 shrink-0"
            />
          </label>
        </div>

        {/* Profile Visibility */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">{t('privacySettingsPage.profileVisibility.heading')}</h3>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex-1 pr-4">
                <div className="font-medium text-gray-900">{t('privacySettingsPage.profileVisibility.showProfileToEveryone.label')}</div>
                <div className="text-sm text-gray-600">{t('privacySettingsPage.profileVisibility.showProfileToEveryone.desc')}</div>
              </div>
              <input
                type="checkbox"
                checked={settings.showProfileToEveryone}
                onChange={(e) => updateSetting('showProfileToEveryone', e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 shrink-0"
              />
            </label>

            <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex-1 pr-4">
                <div className="font-medium text-gray-900">{t('privacySettingsPage.profileVisibility.showOnlineStatus.label')}</div>
                <div className="text-sm text-gray-600">{t('privacySettingsPage.profileVisibility.showOnlineStatus.desc')}</div>
              </div>
              <input
                type="checkbox"
                checked={settings.showOnlineStatus}
                onChange={(e) => updateSetting('showOnlineStatus', e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 shrink-0"
              />
            </label>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? t('common.saving') : t('common.saveSettings')}
          </button>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-600" />
            <h3 className="font-medium text-red-900">{t('accountSettings.dangerZoneTitle')}</h3>
          </div>
          <p className="text-sm text-red-800">{t('accountSettings.dangerZoneBody')}</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              href="/settings?tab=privacy&accountTab=delete"
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              {t('accountSettings.dangerZoneCta')}
            </Link>
            <Link
              href="/delete-account"
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
            >
              {t('accountSettings.publicDeletePageLink')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
