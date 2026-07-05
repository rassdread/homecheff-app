'use client';

import { useCallback, useRef, useState } from 'react';
import { AlertCircle, Camera, Upload, X } from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';
import PhotoCarousel from '@/components/ui/PhotoCarousel';
import { useTranslation } from '@/hooks/useTranslation';
import { compressImage } from '@/lib/imageOptimization';

export type ProfileV2VehiclePhoto = {
  id: string;
  fileUrl: string;
  sortOrder?: number;
};

const MAX_VEHICLE_PHOTOS = 5;

type OwnerProps = {
  mode: 'owner';
  initialPhotos: ProfileV2VehiclePhoto[];
};

type PublicProps = {
  mode: 'public';
  photos: ProfileV2VehiclePhoto[];
};

type Props = OwnerProps | PublicProps;

export function ProfileV2VehiclePhotos({ ...props }: Props) {
  if (props.mode === 'owner') {
    return <VehiclePhotoOwner initialPhotos={props.initialPhotos} />;
  }
  return <VehiclePhotoPublic photos={props.photos} />;
}

function VehiclePhotoPublic({ photos }: { photos: ProfileV2VehiclePhoto[] }) {
  const { t } = useTranslation();

  if (photos.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        {t('profileV2.vertrouwen.sections.vehicle.emptyPublic')}
      </p>
    );
  }

  const carouselPhotos = photos.map((p) => ({
    id: p.id,
    fileUrl: p.fileUrl,
    sortOrder: p.sortOrder ?? 0,
  }));

  return (
    <div className="space-y-6">
      <PhotoCarousel
        photos={carouselPhotos}
        className="w-full"
        showThumbnails
        autoPlay={false}
      />
      <div>
        <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
          <Camera className="h-4 w-4" aria-hidden />
          {t('profileV2.vertrouwen.sections.vehicle.allPhotos', { count: photos.length })}
        </h4>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square overflow-hidden rounded-xl border border-gray-200"
            >
              <SafeImage
                src={photo.fileUrl}
                alt={t('profileV2.vertrouwen.sections.vehicle.photoAlt')}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VehiclePhotoOwner({ initialPhotos }: { initialPhotos: ProfileV2VehiclePhoto[] }) {
  const { t } = useTranslation();
  const [photos, setPhotos] = useState<ProfileV2VehiclePhoto[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const canAddMore = photos.length < MAX_VEHICLE_PHOTOS;

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      const remaining = MAX_VEHICLE_PHOTOS - photos.length;
      if (remaining <= 0) {
        alert(t('upload.maxPhotosReached', { maxPhotos: MAX_VEHICLE_PHOTOS }));
        return;
      }

      const validFiles = Array.from(files)
        .filter((file) => {
          if (!file.type.startsWith('image/')) {
            alert(t('upload.fileNotImage', { fileName: file.name }));
            return false;
          }
          if (file.size > 10 * 1024 * 1024) {
            alert(t('upload.fileTooLargeWithName', { fileName: file.name, maxSize: 10 }));
            return false;
          }
          return true;
        })
        .slice(0, remaining);

      if (validFiles.length === 0) return;

      setUploading(true);

      const getFileToUpload = async (file: File): Promise<File> => {
        if (file.size <= 500 * 1024) return file;
        try {
          const blob = await compressImage(file, 1920, 1080, 0.8);
          return new File([blob], file.name.replace(/\.[^.]+$/i, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
        } catch {
          return file;
        }
      };

      const results = await Promise.all(
        validFiles.map(async (file) => {
          try {
            const fileToUpload = await getFileToUpload(file);
            const formData = new FormData();
            formData.append('photos', fileToUpload);
            const response = await fetch('/api/delivery/upload-vehicle-photos', {
              method: 'POST',
              body: formData,
            });
            if (!response.ok) {
              return { success: false as const };
            }
            const data = (await response.json()) as {
              photos?: Array<{ id: string; fileUrl: string; sortOrder?: number }>;
            };
            const batch = (data.photos ?? [])
              .filter((p) => p?.fileUrl)
              .map((p) => ({
                id: p.id,
                fileUrl: p.fileUrl,
                sortOrder: p.sortOrder,
              }));
            if (batch.length === 0) return { success: false as const };
            return { success: true as const, photos: batch };
          } catch {
            return { success: false as const };
          }
        }),
      );

      const uploaded = results
        .filter((r) => r.success)
        .flatMap((r) => (r.success ? r.photos : []));

      if (uploaded.length > 0) {
        setPhotos((prev) => [...prev, ...uploaded]);
      }

      const failed = results.filter((r) => !r.success).length;
      if (failed > 0) {
        alert(t('profileV2.vertrouwen.sections.vehicle.uploadFailed', { count: failed }));
      }

      setUploading(false);
    },
    [photos.length, t],
  );

  const handleDelete = useCallback(
    async (photoId: string) => {
      if (!confirm(t('errors.confirmDeletePhoto'))) return;
      try {
        const response = await fetch(`/api/delivery/vehicle-photos/${photoId}`, {
          method: 'DELETE',
        });
        if (!response.ok) return;
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      } catch {
        alert(t('errors.deleteError'));
      }
    },
    [t],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-gray-500">
          {t('profileV2.vertrouwen.sections.vehicle.count', {
            current: photos.length,
            max: MAX_VEHICLE_PHOTOS,
          })}
        </span>
      </div>

      {canAddMore ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-gray-50 p-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center rounded-md bg-primary-brand px-3 py-2 text-sm font-medium text-white transition hover:bg-primary-brand/90 disabled:opacity-50"
          >
            <Upload className="mr-2 h-4 w-4" aria-hidden />
            {uploading
              ? t('profileV2.vertrouwen.sections.vehicle.uploading')
              : t('profileV2.vertrouwen.sections.vehicle.addPhotos')}
          </button>
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-50 disabled:opacity-50"
          >
            <Camera className="mr-2 h-4 w-4" aria-hidden />
            {t('common.camera')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => void handleUpload(e.target.files)}
          />
          <input
            ref={cameraInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            capture="environment"
            className="sr-only"
            onChange={(e) => void handleUpload(e.target.files)}
          />
        </div>
      ) : null}

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative">
              <div className="aspect-square overflow-hidden rounded-lg border border-gray-200">
                <SafeImage
                  src={photo.fileUrl}
                  alt={t('profileV2.vertrouwen.sections.vehicle.photoAlt')}
                  fill
                  className="object-cover"
                  sizes="25vw"
                />
              </div>
              <button
                type="button"
                onClick={() => void handleDelete(photo.id)}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-100 transition hover:bg-red-600 sm:opacity-0 sm:group-hover:opacity-100"
                aria-label={t('profileV2.vertrouwen.sections.vehicle.deletePhoto')}
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">{t('profileV2.vertrouwen.sections.vehicle.emptyOwner')}</p>
      )}

      {photos.length < 2 ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{t('profileV2.vertrouwen.sections.vehicle.verificationHint')}</p>
        </div>
      ) : null}
    </div>
  );
}
