'use client';

import { useRef, useState } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { uploadFile } from '@/lib/upload';
import { useTranslation } from '@/hooks/useTranslation';
import {
  BARTER_OFFER_IMAGE_MAX,
  normalizeBarterOfferImageUrls,
} from '@/lib/proposals/barter-offer-images';

type Props = {
  value: string[];
  onChange: (urls: string[]) => void;
  idPrefix?: string;
};

/**
 * Optional 1–2 photos of non-listed barter counter-value.
 * Uses generic authenticated /api/upload — no Product created.
 */
export default function BarterOfferImageUploader({
  value,
  onChange,
  idPrefix = 'barter-offer',
}: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const urls = normalizeBarterOfferImageUrls(value);
  const canAdd = urls.length < BARTER_OFFER_IMAGE_MAX;

  const addFiles = async (files: FileList | null) => {
    if (!files || !canAdd) return;
    setError(null);
    setBusy(true);
    try {
      const next = [...urls];
      for (const file of Array.from(files)) {
        if (next.length >= BARTER_OFFER_IMAGE_MAX) break;
        if (!file.type.startsWith('image/')) {
          setError(t('proposal.barterPhotos.imageOnly'));
          continue;
        }
        const result = await uploadFile(file, '/api/upload');
        if (!result.success || !result.url) {
          setError(result.error || t('proposal.barterPhotos.uploadFailed'));
          continue;
        }
        if (!/^https:\/\//i.test(result.url)) {
          setError(t('proposal.barterPhotos.uploadFailed'));
          continue;
        }
        next.push(result.url);
      }
      onChange(normalizeBarterOfferImageUrls(next));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (index: number) => {
    onChange(urls.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-semibold text-gray-900">
          {t('proposal.barterPhotos.heading')}
        </p>
        <p className="text-[11px] text-gray-500">
          {t('proposal.barterPhotos.hint')}
        </p>
      </div>

      {urls.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, index) => (
            <div
              key={url}
              className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                aria-label={t('proposal.barterPhotos.remove')}
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {canAdd ? (
        <>
          <input
            ref={inputRef}
            id={`${idPrefix}-file`}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => void addFiles(e.target.files)}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <ImagePlus className="h-3.5 w-3.5" aria-hidden />
            )}
            {urls.length === 0
              ? t('proposal.barterPhotos.add')
              : t('proposal.barterPhotos.addAnother')}
          </button>
        </>
      ) : null}

      {error ? (
        <p className="text-[11px] text-amber-800">{error}</p>
      ) : null}
    </div>
  );
}
