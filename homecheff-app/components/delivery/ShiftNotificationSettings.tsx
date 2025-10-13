'use client';

import { useState } from 'react';
import { Bell, Plus, Trash2, Clock, Mail, MessageSquare, Smartphone, Moon, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface NotificationReminder {
  minutes: number;
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
}

interface ShiftNotificationSettingsProps {
  initialSettings?: {
    enablePushNotifications: boolean;
    enableEmailNotifications: boolean;
    enableSmsNotifications: boolean;
    shiftReminders: number[];
    autoGoOnline: boolean;
    quietHoursEnabled: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
  };
  onSave: (settings: any) => Promise<void>;
}

const PRESET_TIMES = [120, 60, 30, 15, 10, 5];

const TIME_LABELS: Record<number, string> = {
  120: '2 uur',
  60: '1 uur',
  30: '30 min',
  15: '15 min',
  10: '10 min',
  5: '5 min',
};

const PRESETS = {
  standard: {
    name: '⏰ Standaard',
    description: '1u, 30m, 5m',
    reminders: [60, 30, 5]
  },
  extraAlert: {
    name: '🔔 Extra Alert',
    description: '2u, 1u, 30m, 10m, 5m',
    reminders: [120, 60, 30, 10, 5]
  },
  minimal: {
    name: '⏱️ Minimaal',
    description: '30m, 5m',
    reminders: [30, 5]
  },
  earlyBird: {
    name: '🌅 Vroege Vogel',
    description: '2u, 1u, 30m',
    reminders: [120, 60, 30]
  }
};

export default function ShiftNotificationSettings({ 
  initialSettings,
  onSave 
}: ShiftNotificationSettingsProps) {
  const [reminders, setReminders] = useState<number[]>(
    initialSettings?.shiftReminders || [60, 30, 5]
  );
  
  const [channels, setChannels] = useState({
    push: initialSettings?.enablePushNotifications ?? true,
    email: initialSettings?.enableEmailNotifications ?? true,
    sms: initialSettings?.enableSmsNotifications ?? false
  });

  const [autoGoOnline, setAutoGoOnline] = useState(
    initialSettings?.autoGoOnline ?? false
  );

  const [quietHours, setQuietHours] = useState({
    enabled: initialSettings?.quietHoursEnabled ?? false,
    start: initialSettings?.quietHoursStart || '22:00',
    end: initialSettings?.quietHoursEnd || '08:00'
  });

  const [customMinutes, setCustomMinutes] = useState('');
  const [loading, setLoading] = useState(false);

  const addReminder = (minutes: number) => {
    if (reminders.length >= 5) {
      alert('Maximaal 5 herinneringen toegestaan');
      return;
    }
    if (reminders.includes(minutes)) {
      alert('Deze herinnering bestaat al');
      return;
    }
    setReminders([...reminders, minutes].sort((a, b) => b - a));
  };

  const removeReminder = (minutes: number) => {
    if (reminders.length <= 2) {
      alert('Minimaal 2 herinneringen vereist');
      return;
    }
    setReminders(reminders.filter(m => m !== minutes));
  };

  const applyPreset = (presetKey: keyof typeof PRESETS) => {
    setReminders(PRESETS[presetKey].reminders);
  };

  const handleAddCustom = () => {
    const minutes = parseInt(customMinutes);
    if (isNaN(minutes) || minutes < 1 || minutes > 180) {
      alert('Voer een geldig aantal minuten in (1-180)');
      return;
    }
    addReminder(minutes);
    setCustomMinutes('');
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave({
        enablePushNotifications: channels.push,
        enableEmailNotifications: channels.email,
        enableSmsNotifications: channels.sms,
        shiftReminders: reminders,
        autoGoOnline,
        quietHoursEnabled: quietHours.enabled,
        quietHoursStart: quietHours.enabled ? quietHours.start : null,
        quietHoursEnd: quietHours.enabled ? quietHours.end : null
      });
    } finally {
      setLoading(false);
    }
  };

  const getNotificationPreview = (minutes: number) => {
    if (minutes === 0) return 'Je shift is begonnen!';
    if (minutes === 5) return 'Je shift begint over 5 minuten!';
    if (minutes === 10) return 'Nog 10 minuten tot je shift';
    if (minutes === 15) return 'Je shift begint over een kwartier';
    if (minutes === 30) return 'Je shift begint over een half uur';
    if (minutes === 60) return 'Je shift begint over 1 uur';
    if (minutes === 120) return 'Je shift begint over 2 uur';
    return `Herinnering ${minutes} minuten voor shift`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-6 h-6 text-primary-600" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Shift Herinneringen</h2>
          <p className="text-sm text-gray-600">Ontvang notificaties voordat je shift begint</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Notification Channels */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border-2 border-blue-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-600" />
            Notificatie Kanalen
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
              <input 
                type="checkbox" 
                checked={channels.push}
                onChange={(e) => setChannels({...channels, push: e.target.checked})}
                className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
              />
              <Bell className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">Push notificaties</div>
                <div className="text-sm text-gray-600">In-app meldingen (Aanbevolen)</div>
              </div>
            </label>
            
            <label className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
              <input 
                type="checkbox" 
                checked={channels.email}
                onChange={(e) => setChannels({...channels, email: e.target.checked})}
                className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
              />
              <Mail className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">Email</div>
                <div className="text-sm text-gray-600">Betrouwbare backup</div>
              </div>
            </label>
            
            <label className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
              <input 
                type="checkbox" 
                checked={channels.sms}
                onChange={(e) => setChannels({...channels, sms: e.target.checked})}
                className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
              />
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">SMS</div>
                <div className="text-sm text-gray-600">Alleen laatste herinnering (+€0.10/bericht)</div>
              </div>
            </label>
          </div>
        </div>

        {/* Active Reminders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              ⏰ Actieve Herinneringen ({reminders.length}/5)
            </h3>
            <span className="text-sm text-gray-600">Min. 2, max. 5</span>
          </div>
          
          <div className="space-y-3">
            {reminders.map((minutes) => (
              <div 
                key={minutes}
                className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg border-2 border-emerald-200 shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="font-semibold text-emerald-700 text-lg">
                      {TIME_LABELS[minutes] || `${minutes} minuten`} voor shift
                    </div>
                    <div className="text-sm text-gray-600 italic">
                      "{getNotificationPreview(minutes)}"
                    </div>
                    <div className="flex gap-2 mt-2">
                      {channels.push && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">📱 Push</span>}
                      {channels.email && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">📧 Email</span>}
                      {channels.sms && minutes === 5 && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">💬 SMS</span>}
                    </div>
                  </div>
                  <button 
                    onClick={() => removeReminder(minutes)}
                    disabled={reminders.length <= 2}
                    className="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed p-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Reminder */}
        {reminders.length < 5 && (
          <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Herinnering Toevoegen
            </h4>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-3">
              {PRESET_TIMES.filter(t => !reminders.includes(t)).map((time) => (
                <button
                  key={time}
                  onClick={() => addReminder(time)}
                  className="p-2 bg-white border-2 border-gray-200 rounded-lg hover:border-primary-brand hover:bg-primary-50 transition-all text-sm font-medium"
                >
                  {TIME_LABELS[time]}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="180"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                placeholder="Aangepast..."
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-transparent"
              />
              <button
                onClick={handleAddCustom}
                disabled={!customMinutes}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Toevoegen
              </button>
            </div>
          </div>
        )}

        {/* Presets */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-600" />
            Snelle Presets
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => applyPreset(key as keyof typeof PRESETS)}
                className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg hover:from-blue-100 hover:to-cyan-100 transition-all text-left"
              >
                <div className="font-semibold text-sm">{preset.name}</div>
                <div className="text-xs text-gray-600">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Auto Online */}
        <label className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 cursor-pointer hover:from-green-100 hover:to-emerald-100 transition-all">
          <input 
            type="checkbox" 
            checked={autoGoOnline}
            onChange={(e) => setAutoGoOnline(e.target.checked)}
            className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
          />
          <div className="flex-1">
            <div className="font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-600" />
              Automatisch Online bij Shift Start
            </div>
            <div className="text-sm text-gray-600">
              Je gaat automatisch online zonder handmatig te hoeven klikken
            </div>
          </div>
        </label>

        {/* Quiet Hours */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border-2 border-indigo-200">
          <label className="flex items-center gap-3 mb-4 cursor-pointer">
            <input 
              type="checkbox" 
              checked={quietHours.enabled}
              onChange={(e) => setQuietHours({...quietHours, enabled: e.target.checked})}
              className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold text-gray-900">Stille Uren</span>
            </div>
          </label>
          
          {quietHours.enabled && (
            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <label className="text-sm text-gray-700 mb-1 block">Van</label>
                <input
                  type="time"
                  value={quietHours.start}
                  onChange={(e) => setQuietHours({...quietHours, start: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm text-gray-700 mb-1 block">Tot</label>
                <input
                  type="time"
                  value={quietHours.end}
                  onChange={(e) => setQuietHours({...quietHours, end: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand"
                />
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-3 rounded-xl shadow-lg"
          >
            {loading ? 'Opslaan...' : 'Notificatie Instellingen Opslaan'}
          </Button>
        </div>
      </div>
    </div>
  );
}

