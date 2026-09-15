'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, ImageIcon } from 'lucide-react';
import { persistProfilePhotoUrl, uploadProfilePhoto } from '@/lib/upload';
import { useTranslation } from '@/hooks/useTranslation';
import { Modal } from '@/components/ui/Modal';

type Props = {
  open: boolean;
  onClose: () => void;
  currentUrl?: string | null;
  onPhotoChange?: (url: string | null) => void;
};

function revokeIfBlob(url: string | null) {
  if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
}

/** Owner photo editor: visible file control, preview, save, cancel. No hidden-input click(). */
export default function ProfileV2HeroPhotoEdit({
  open,
  onClose,
  currentUrl,
  onPhotoChange,
}: Props) {
  const { t } = useTranslation();
  const pickId = useId();
  const cameraId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setError(null);
      setUploading(false);
      setPreviewUrl((prev) => {
        revokeIfBlob(prev);
        return null;
      });
    }
  }, [open]);

  useEffect(() => {
    return () => revokeIfBlob(previewUrl);
  }, [previewUrl]);

  function applyFile(file: File | undefined) {
    if (!file || uploading) return;
    if (!file.type.startsWith('image/')) {
      setError(t('upload.onlyImagesAllowed'));
      return;
    }
    setError(null);
    setSelectedFile(file);
    setPreviewUrl((prev) => {
      revokeIfBlob(prev);
      return URL.createObjectURL(file);
    });
  }

  function resetFileInputs() {
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }

  function handleCancel() {
    if (uploading) return;
    setError(null);
    setSelectedFile(null);
    setPreviewUrl((prev) => {
      revokeIfBlob(prev);
      return null;
    });
    resetFileInputs();
    onClose();
  }

  async function handleSave() {
    if (!selectedFile || uploading) return;
    setUploading(true);
    setError(null);
    try {
      const result = await uploadProfilePhoto(selectedFile);
      if (!result.success || !result.url) {
        setError(result.error ?? t('errors.uploadError'));
        return;
      }
      const persisted = await persistProfilePhotoUrl(result.url);
      if (!persisted.success) {
        setError(persisted.error ?? t('errors.uploadError'));
        return;
      }
      onPhotoChange?.(result.url);
      setSelectedFile(null);
      setPreviewUrl((prev) => {
        revokeIfBlob(prev);
        return null;
      });
      resetFileInputs();
      onClose();
    } catch {
      setError(t('errors.uploadError'));
    } finally {
      setUploading(false);
    }
  }

  const shownSrc = previewUrl || currentUrl || '/avatar-placeholder.png';
  const chooseLabel = selectedFile
    ? t('profileV2.actions.chooseOtherPhoto') || t('common.choosePhoto') || 'Andere foto kiezen'
    : t('profileV2.actions.choosePhoto') || 'Foto kiezen';

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <Modal
      open={open}
      onClose={handleCancel}
      labelledById="hc-profile-photo-edit-title"
      closeOnOverlayClick={!uploading}
      overlayClassName="fixed inset-0 z-[220] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      overlayProps={{ 'data-hc-profile-photo-editor': 'open' }}
    >
      <div
        className="pointer-events-auto relative z-[221] w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-t-2xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="hc-profile-photo-edit-title" className="text-lg font-semibold text-gray-900">
          {t('profileV2.actions.changeProfilePhoto') || t('profileV2.actions.changePhoto')}
        </h2>
        <p className="mt-1 text-sm text-gray-600">{t('profileV2.photo.hint')}</p>

        <div className="mt-4 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shownSrc}
            alt={t('profilePage.profilePhotoAlt')}
            className="h-36 w-36 rounded-full border-4 border-white object-cover shadow-md ring-2 ring-emerald-200"
          />
        </div>

        {error ? (
          <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex flex-col gap-2">
          <label
            htmlFor={pickId}
            className="relative inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm"
            data-hc-profile-photo-choose=""
          >
            <input
              id={pickId}
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              disabled={uploading}
              className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
              tabIndex={-1}
              onChange={(e) => {
                applyFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <ImageIcon className="h-4 w-4" aria-hidden />
            {chooseLabel}
          </label>

          <label
            htmlFor={cameraId}
            className="relative inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-900"
            data-hc-profile-photo-camera=""
          >
            <input
              id={cameraId}
              ref={cameraInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              capture="environment"
              disabled={uploading}
              className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
              tabIndex={-1}
              onChange={(e) => {
                applyFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <Camera className="h-4 w-4" aria-hidden />
            {t('common.camera')}
          </label>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleCancel}
            disabled={uploading}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 disabled:opacity-50"
            data-hc-profile-photo-cancel=""
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={uploading || !selectedFile}
            className="hc-btn-primary inline-flex min-h-[44px] items-center justify-center px-4 py-2.5 disabled:opacity-50"
            data-hc-profile-photo-save=""
          >
            {uploading ? t('common.loadingDots') : t('common.save')}
          </button>
        </div>
      </div>
    </Modal>,
    document.body,
  );
}
