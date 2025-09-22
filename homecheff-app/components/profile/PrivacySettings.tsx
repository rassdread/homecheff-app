'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  Shield, Eye, EyeOff, MessageCircle, Users, UserPlus, 
  Bell, Activity, Save, AlertCircle, Check, Home, ArrowLeft
} from 'lucide-react';

interface PrivacySettings {
  messagePrivacy: 'NOBODY' | 'FANS_ONLY' | 'EVERYONE';
  fanRequestEnabled: boolean;
  showFansList: boolean;
  showProfileToEveryone: boolean;
  showOnlineStatus: boolean;
  allowProfileViews: boolean;
  showActivityStatus: boolean;
}

interface PrivacySettingsProps {
  onClose?: () => void;
}

export default function PrivacySettings({ onClose }: PrivacySettingsProps) {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<PrivacySettings>({
    messagePrivacy: 'EVERYONE',
    fanRequestEnabled: true,
    showFansList: true,
    showProfileToEveryone: true,
    showOnlineStatus: true,
    allowProfileViews: true,
    showActivityStatus: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load current privacy settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!(session as any)?.user?.id) return;
      
      setLoading(true);
      try {
        const response = await fetch('/api/profile/privacy');
        if (response.ok) {
          const data = await response.json();
          setSettings(data.settings);
        }
      } catch (error) {
        console.error('Error loading privacy settings:', error);
        setMessage({ type: 'error', text: 'Kon privacy instellingen niet laden' });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [session]);

  const handleSave = async () => {
    if (!(session as any)?.user?.id) return;

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
        setMessage({ type: 'success', text: 'Privacy instellingen opgeslagen!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      setMessage({ type: 'error', text: 'Kon instellingen niet opslaan' });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof PrivacySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Back to Home Button */}
      <div className="px-6 pt-4">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Terug naar Home</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-2 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Privacy Instellingen</h2>
            <p className="text-sm text-gray-600">Beheer wie je profiel en berichten kan zien</p>
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

      {/* Settings Content */}
      <div className="p-6 space-y-6">
        {/* Message Privacy */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Berichten Privacy</h3>
          </div>
          <p className="text-sm text-gray-600">Wie mag je berichten sturen?</p>
          <div className="space-y-2">
            {[
              { value: 'EVERYONE', label: 'Iedereen', desc: 'Alle gebruikers kunnen je berichten sturen' },
              { value: 'FANS_ONLY', label: 'Alleen Fans', desc: 'Alleen goedgekeurde fans kunnen je berichten sturen' },
              { value: 'NOBODY', label: 'Niemand', desc: 'Alleen admins en leveringsberichten zijn toegestaan' }
            ].map(option => (
              <label key={option.value} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="messagePrivacy"
                  value={option.value}
                  checked={settings.messagePrivacy === option.value}
                  onChange={(e) => updateSetting('messagePrivacy', e.target.value)}
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

        {/* Fan Settings */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Fan Instellingen</h3>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex-1">
                <div className="font-medium text-gray-900">Fan verzoeken toestaan</div>
                <div className="text-sm text-gray-600">Anderen kunnen verzoeken om je fan te worden</div>
              </div>
              <input
                type="checkbox"
                checked={settings.fanRequestEnabled}
                onChange={(e) => updateSetting('fanRequestEnabled', e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex-1">
                <div className="font-medium text-gray-900">Fans lijst tonen</div>
                <div className="text-sm text-gray-600">Toon de lijst van je fans op je profiel (aantal blijft altijd zichtbaar)</div>
              </div>
              <input
                type="checkbox"
                checked={settings.showFansList}
                onChange={(e) => updateSetting('showFansList', e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        {/* Profile Visibility */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Profiel Zichtbaarheid</h3>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex-1">
                <div className="font-medium text-gray-900">Profiel publiek zichtbaar</div>
                <div className="text-sm text-gray-600">Je profiel is vindbaar en zichtbaar voor anderen</div>
              </div>
              <input
                type="checkbox"
                checked={settings.showProfileToEveryone}
                onChange={(e) => updateSetting('showProfileToEveryone', e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex-1">
                <div className="font-medium text-gray-900">Online status tonen</div>
                <div className="text-sm text-gray-600">Toon wanneer je online bent</div>
              </div>
              <input
                type="checkbox"
                checked={settings.showOnlineStatus}
                onChange={(e) => updateSetting('showOnlineStatus', e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex-1">
                <div className="font-medium text-gray-900">Profiel views toestaan</div>
                <div className="text-sm text-gray-600">Anderen kunnen zien dat ze je profiel hebben bekeken</div>
              </div>
              <input
                type="checkbox"
                checked={settings.allowProfileViews}
                onChange={(e) => updateSetting('allowProfileViews', e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex-1">
                <div className="font-medium text-gray-900">Activiteit status tonen</div>
                <div className="text-sm text-gray-600">Toon je recente activiteiten (posts, reviews, etc.)</div>
              </div>
              <input
                type="checkbox"
                checked={settings.showActivityStatus}
                onChange={(e) => updateSetting('showActivityStatus', e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        {/* Message */}
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

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Opslaan...' : 'Instellingen Opslaan'}
          </button>
        </div>
      </div>
    </div>
  );
}
