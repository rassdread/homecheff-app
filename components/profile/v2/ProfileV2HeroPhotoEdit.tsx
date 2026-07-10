'use client';

import { useRef, useState } from 'react';
import { Camera, ImageIcon } from 'lucide-react';
import { uploadProfilePhoto } from '@/lib/upload';
import { useTranslation } from '@/hooks/useTranslation';

type Props = {
  initialUrl?: string | null;
  onPhotoChange?: (url: string | null) => void;
};

/** Compact profielfoto-wijziging onder avatar — geen 192px preview-blok. */
export default function ProfileV2HeroPhotoEdit({ initialUrl, onPhotoChange }: Props) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file || uploading) return;
    if (!file.type.startsWith('image/')) {
      alert(t('upload.onlyImagesAllowed'));
      return;
    }
    setUploading(true);
    try {
      const result = await uploadProfilePhoto(file);
      if (result.success && result.url) {
        onPhotoChange?.(result.url);
      } else {
        alert(result.error ?? t('errors.uploadError'));
      }
    } catch {
      alert(t('errors.uploadError'));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-2 xl:justify-start">
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
      >
        <ImageIcon className="h-3.5 w-3.5" aria-hidden />
        {uploading ? t('common.loadingDots') : t('profileV2.actions.changePhoto')}
      </button>
      <button
        type="button"
        disabled={uploading}
        onClick={() => cameraInputRef.current?.click()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
      >
        <Camera className="h-3.5 w-3.5" aria-hidden />
        {t('common.camera')}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {initialUrl ? (
        <span className="sr-only">{t('profilePage.profilePhotoAlt')}</span>
      ) : null}
    </div>
  );
}
