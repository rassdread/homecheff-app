'use client';

import { useState } from 'react';
import VideoUploader from '@/components/ui/VideoUploader';
import { startHomeCheffPhotoVideoCreator } from '@/lib/studio/px4a-item-client';
import { useTranslation } from '@/hooks/useTranslation';

type ListingVideo = {
  url: string;
  thumbnail?: string | null;
  duration?: number | null;
} | null;

export function ListingPhotoVideoBlock({
  video,
  onVideoChange,
  photoUrls,
  onPersistDraft,
  exportPending,
  disabled,
}: {
  video: ListingVideo;
  onVideoChange: (video: ListingVideo) => void;
  photoUrls: string[];
  onPersistDraft: () => void;
  exportPending?: boolean;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const [replaceIntent, setReplaceIntent] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasVideo = Boolean(video?.url);
  const showCreator = !hasVideo || replaceIntent;

  const startCreator = async () => {
    setError(null);
    setStarting(true);
    try {
      onPersistDraft();
      await startHomeCheffPhotoVideoCreator(photoUrls);
    } catch {
      setError(t('marketplace.form.videoMakeFreeError'));
      setStarting(false);
    }
  };

  return (
    <div data-testid="listing-video-block">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t('marketplace.form.videoLabel')}
      </label>
      <p className="text-xs text-gray-500 mb-2">{t('marketplace.form.videoHint')}</p>

      {exportPending ? (
        <p
          className="mb-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-900"
          data-testid="px4a-export-pending"
          role="status"
        >
          {t('marketplace.form.videoExportPending')}
        </p>
      ) : null}

      {hasVideo && !replaceIntent ? (
        <>
          <VideoUploader
            value={video}
            onChange={onVideoChange}
            maxDuration={30}
            uploadContext="dish"
            hideHeading
            disabled={disabled}
          />
          <button
            type="button"
            data-testid="px4a-replace-video"
            className="mt-2 min-h-11 text-sm font-medium text-emerald-800 underline"
            disabled={disabled}
            onClick={() => setReplaceIntent(true)}
          >
            {t('marketplace.form.videoReplace')}
          </button>
        </>
      ) : (
        <>
          {replaceIntent ? (
            <p className="mb-2 text-xs text-gray-600">{t('marketplace.form.videoReplaceHint')}</p>
          ) : null}
          <VideoUploader
            value={replaceIntent ? null : video}
            onChange={(next) => {
              onVideoChange(next);
              if (next?.url) setReplaceIntent(false);
            }}
            maxDuration={30}
            uploadContext="dish"
            hideHeading
            disabled={disabled}
          />
          <div className="mt-3 space-y-2">
            <button
              type="button"
              data-testid="px4a-make-free-video"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"
              disabled={disabled || starting}
              onClick={() => void startCreator()}
            >
              {starting ? t('marketplace.form.videoMakeFreeStarting') : t('marketplace.form.videoMakeFree')}
            </button>
            <p className="text-xs text-gray-600">{t('marketplace.form.videoMakeFreeHint')}</p>
            <p className="text-xs text-gray-500">{t('marketplace.form.videoMakeFreeBenefit')}</p>
            <p className="text-[11px] text-gray-400">{t('marketplace.form.videoStudioAttribution')}</p>
          </div>
          {replaceIntent ? (
            <button
              type="button"
              className="mt-2 min-h-11 text-sm font-medium text-gray-700 underline"
              onClick={() => setReplaceIntent(false)}
            >
              {t('marketplace.form.videoReplaceCancel')}
            </button>
          ) : null}
        </>
      )}

      {error ? (
        <p className="mt-2 text-sm text-red-700" role="status">
          {error}
        </p>
      ) : null}
    </div>
  );
}
