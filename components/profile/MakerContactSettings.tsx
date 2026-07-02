'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Phone,
  MessageCircle,
  Instagram,
  Facebook,
  Globe,
  Send,
  Loader2,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/hooks/useTranslation';
import {
  EMPTY_MAKER_CONTACT_SETTINGS,
  type MakerContactSettingsDraft,
  type ContactValidationErrorKey,
} from '@/lib/profile/maker-contact-preferences';

type FieldConfig = {
  enabledKey: keyof MakerContactSettingsDraft;
  valueKey: keyof MakerContactSettingsDraft;
  labelKey: string;
  placeholderKey: string;
  icon: React.ComponentType<{ className?: string }>;
  inputMode?: 'tel' | 'url' | 'text';
};

const CONTACT_FIELDS: FieldConfig[] = [
  {
    enabledKey: 'publicPhoneEnabled',
    valueKey: 'publicPhoneNumber',
    labelKey: 'makerContact.fields.phone',
    placeholderKey: 'makerContact.placeholders.phone',
    icon: Phone,
    inputMode: 'tel',
  },
  {
    enabledKey: 'publicWhatsappEnabled',
    valueKey: 'publicWhatsappNumber',
    labelKey: 'makerContact.fields.whatsapp',
    placeholderKey: 'makerContact.placeholders.whatsapp',
    icon: MessageCircle,
    inputMode: 'tel',
  },
  {
    enabledKey: 'publicInstagramEnabled',
    valueKey: 'instagramUrl',
    labelKey: 'makerContact.fields.instagram',
    placeholderKey: 'makerContact.placeholders.instagram',
    icon: Instagram,
    inputMode: 'url',
  },
  {
    enabledKey: 'publicFacebookEnabled',
    valueKey: 'facebookUrl',
    labelKey: 'makerContact.fields.facebook',
    placeholderKey: 'makerContact.placeholders.facebook',
    icon: Facebook,
    inputMode: 'url',
  },
  {
    enabledKey: 'publicTikTokEnabled',
    valueKey: 'tiktokUrl',
    labelKey: 'makerContact.fields.tiktok',
    placeholderKey: 'makerContact.placeholders.tiktok',
    icon: Globe,
    inputMode: 'url',
  },
  {
    enabledKey: 'publicWebsiteEnabled',
    valueKey: 'websiteUrl',
    labelKey: 'makerContact.fields.website',
    placeholderKey: 'makerContact.placeholders.website',
    icon: Globe,
    inputMode: 'url',
  },
  {
    enabledKey: 'publicTelegramEnabled',
    valueKey: 'telegramUrl',
    labelKey: 'makerContact.fields.telegram',
    placeholderKey: 'makerContact.placeholders.telegram',
    icon: Send,
    inputMode: 'url',
  },
];

const ERROR_FIELD_MAP: Record<string, keyof MakerContactSettingsDraft | 'general'> = {
  phone: 'publicPhoneNumber',
  whatsapp: 'publicWhatsappNumber',
  instagram: 'instagramUrl',
  facebook: 'facebookUrl',
  tiktok: 'tiktokUrl',
  website: 'websiteUrl',
  telegram: 'telegramUrl',
};

export default function MakerContactSettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<MakerContactSettingsDraft>(
    EMPTY_MAKER_CONTACT_SETTINGS,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/profile/contact');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings ?? EMPTY_MAKER_CONTACT_SETTINGS);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateField = <K extends keyof MakerContactSettingsDraft>(
    key: K,
    value: MakerContactSettingsDraft[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSuccess(false);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    setFieldErrors({});
    try {
      const res = await fetch('/api/profile/contact', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.fieldErrors) {
          const mapped: Record<string, string> = {};
          for (const [field, errKey] of Object.entries(data.fieldErrors)) {
            const formKey = ERROR_FIELD_MAP[field] ?? field;
            mapped[formKey as string] = t(
              `makerContact.errors.${errKey as ContactValidationErrorKey}`,
            );
          }
          setFieldErrors(mapped);
        }
        return;
      }
      setSettings(data.settings ?? settings);
      setSuccess(true);
    } catch {
      setFieldErrors({ general: t('makerContact.errors.saveFailed') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" aria-hidden />
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{t('makerContact.settingsTitle')}</h2>
        <p className="text-sm text-gray-600 mt-1">{t('makerContact.settingsIntro')}</p>
        <p className="text-sm text-gray-500 mt-2">{t('makerContact.premiumFutureNote')}</p>
      </div>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden />
          <div>
            <p className="font-medium text-gray-900">{t('makerContact.fields.chat')}</p>
            <p className="text-xs text-gray-600">{t('makerContact.chatAlwaysOn')}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {CONTACT_FIELDS.map((field) => {
          const Icon = field.icon;
          const enabled = Boolean(settings[field.enabledKey]);
          const valueKey = field.valueKey;
          const value = String(settings[valueKey] ?? '');
          const error = fieldErrors[valueKey as string];

          return (
            <div
              key={field.enabledKey}
              className="rounded-xl border border-gray-200 p-4 space-y-3"
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => updateField(field.enabledKey, e.target.checked as never)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <Icon className="w-4 h-4 text-gray-600 shrink-0" aria-hidden />
                <span className="font-medium text-gray-900">{t(field.labelKey)}</span>
              </label>
              {enabled ? (
                <div>
                  <input
                    type={field.inputMode === 'tel' ? 'tel' : 'text'}
                    inputMode={field.inputMode}
                    value={value}
                    onChange={(e) => updateField(valueKey, e.target.value as never)}
                    placeholder={t(field.placeholderKey)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      error ? 'border-red-300' : 'border-gray-300'
                    }`}
                    autoComplete="off"
                  />
                  {error ? (
                    <p className="mt-1 text-xs text-red-600" role="alert">
                      {error}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {fieldErrors.general ? (
        <p className="text-sm text-red-600" role="alert">
          {fieldErrors.general}
        </p>
      ) : null}

      {success ? (
        <p className="text-sm text-emerald-700">{t('makerContact.saveSuccess')}</p>
      ) : null}

      <Button
        type="button"
        onClick={() => void handleSave()}
        disabled={saving}
        className="bg-primary-brand hover:bg-primary-700 text-white"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden />
            {t('common.saving')}
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" aria-hidden />
            {t('makerContact.save')}
          </>
        )}
      </Button>
    </div>
  );
}
