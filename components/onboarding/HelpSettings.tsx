'use client';

import { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { disableAllHints, enableAllHints, loadOnboardingPreferences } from '@/lib/onboarding/storage';

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

export default function HelpSettings() {
  const [helpEnabled, setHelpEnabled] = useState(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    // Load help preferences
    const prefs = loadOnboardingPreferences();
    setHelpEnabled(!prefs.disableAllHints);
  }, []);

  const handleToggle = () => {
    const newValue = !helpEnabled;
    setHelpEnabled(newValue);
    if (newValue) {
      enableAllHints();
    } else {
      disableAllHints();
    }
    setSaveMessage('✅ Help voorkeuren opgeslagen');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
      <div className="flex items-center space-x-3 mb-4">
        <HelpCircle className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-medium text-gray-900">Help & Uitleg</h3>
      </div>
      
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Info icons & Rondleidingen:</strong> HomeCheff helpt je door de app met info icons (ℹ️) en rondleidingen. Als je alles al weet, kun je deze hier uitschakelen.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">Info icons en rondleidingen tonen</h4>
            <p className="text-sm text-gray-500">
              {helpEnabled 
                ? 'Info icons en rondleidingen zijn ingeschakeld - je krijgt uitleg bij functies'
                : 'Info icons en rondleidingen zijn uitgeschakeld - geen popups of uitleg'}
            </p>
          </div>
          <ToggleButton
            enabled={helpEnabled}
            onClick={handleToggle}
          />
        </div>

        {!helpEnabled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ Alle info icons en rondleidingen zijn nu uitgeschakeld. Je kunt ze altijd weer inschakelen via deze instelling.
            </p>
          </div>
        )}

        {saveMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">{saveMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}

