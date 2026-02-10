'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { Check, X } from 'lucide-react';

function SelectPhotosPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [photos, setPhotos] = useState<Array<{ url: string; id?: string; type?: 'image' | 'video'; thumbnail?: string | null }>>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
  const [source, setSource] = useState<'recipe' | 'inspiratie' | 'garden' | 'design' | 'product'>('recipe');
  const MAX_PHOTOS = 5;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!searchParams) return;

    // Get source type from URL
    const sourceParam = searchParams.get('source');
    if (sourceParam && ['recipe', 'inspiratie', 'garden', 'design', 'product'].includes(sourceParam)) {
      setSource(sourceParam as any);
    }

    // Load photos from storage
    const storageKey = sourceParam === 'recipe' ? 'recipeToProductData' :
                      sourceParam === 'inspiratie' ? 'inspiratieToProductData' :
                      sourceParam === 'garden' ? 'gardenToProductData' :
                      sourceParam === 'product' ? 'productToShortFormData' :
                      'designToProductData';

    const parseStoredData = (key: string) => {
      const sessionRaw = window.sessionStorage.getItem(key);
      const localRaw = window.localStorage.getItem(key);
      const raw = sessionRaw ?? localRaw;

      if (!raw) return null;

      try {
        return JSON.parse(raw);
      } catch (error) {
        console.error(`Error parsing stored data for ${key}:`, error);
        return null;
      }
    };

    const data = parseStoredData(storageKey);
    
    // Combine photos and video (if available) into one array
    const mediaArray: Array<{ url: string; id?: string; type?: 'image' | 'video'; thumbnail?: string | null }> = [];
    
    if (data && data.photos && Array.isArray(data.photos) && data.photos.length > 0) {
      // Add photos
      data.photos.forEach((photo: any, index: number) => {
        mediaArray.push({
          url: photo.url || photo,
          id: photo.id || `photo-${index}`,
          type: 'image'
        });
      });
    }
    
    // Add video if available (only for product source)
    if (source === 'product' && data && data.video && data.video.url) {
      mediaArray.push({
        url: data.video.url,
        id: data.video.id || 'video-0',
        type: 'video',
        thumbnail: data.video.thumbnail || null
      });
    }
    
    if (mediaArray.length > 0) {
      setPhotos(mediaArray);
      
      // Auto-select first MAX_PHOTOS if there are more
      if (mediaArray.length > MAX_PHOTOS) {
        const initialSelection = new Set(Array.from({ length: MAX_PHOTOS }, (_, i) => i));
        setSelectedPhotos(initialSelection);
      } else {
        // Select all if 5 or less
        setSelectedPhotos(new Set(mediaArray.map((_, i) => i)));
      }
    } else {
      // No photos found, go back or to form
      router.push('/sell/new');
    }
  }, [searchParams, router]);

  const togglePhotoSelection = (index: number) => {
    setSelectedPhotos(prev => {
      const newSelection = new Set(prev);
      
      if (newSelection.has(index)) {
        newSelection.delete(index);
      } else {
        // Only allow selecting if under max
        if (newSelection.size < MAX_PHOTOS) {
          newSelection.add(index);
        }
      }
      
      return newSelection;
    });
  };

  const continueToForm = () => {
    if (selectedPhotos.size === 0) {
      alert(t('productForm.photosRequired'));
      return;
    }

    if (selectedPhotos.size > MAX_PHOTOS) {
      alert(t('productForm.maxPhotosExceeded', { max: MAX_PHOTOS }));
      return;
    }

    // Update stored data with selected photos only
    const storageKey = source === 'recipe' ? 'recipeToProductData' :
                      source === 'inspiratie' ? 'inspiratieToProductData' :
                      source === 'garden' ? 'gardenToProductData' :
                      source === 'product' ? 'productToShortFormData' :
                      'designToProductData';

    const parseStoredData = (key: string) => {
      const sessionRaw = window.sessionStorage.getItem(key);
      const localRaw = window.localStorage.getItem(key);
      const raw = sessionRaw ?? localRaw;
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    };

    const data = parseStoredData(storageKey);
    
    if (data) {
      // Filter photos/videos to only selected ones
      const selectedPhotoArray = Array.from(selectedPhotos).sort((a, b) => a - b);
      const filteredMedia = selectedPhotoArray.map(index => {
        const media = photos[index];
        // Check if this is a video
        if (media.type === 'video') {
          return data.video || media;
        }
        // Otherwise it's a photo
        return data.photos?.[index] || media;
      });
      
      // Separate photos and video
      const filteredPhotos = filteredMedia.filter(m => m.type !== 'video');
      const selectedVideo = filteredMedia.find(m => m.type === 'video') || null;
      
      // Update data with filtered photos and video
      const updatedData = {
        ...data,
        photos: filteredPhotos,
        ...(selectedVideo && { video: selectedVideo })
      };

      // Save back to storage
      const jsonData = JSON.stringify(updatedData);
      window.sessionStorage.setItem(storageKey, jsonData);
      window.localStorage.setItem(storageKey, jsonData);

      // Navigate to form with appropriate parameters
      const params = new URLSearchParams();
      if (source === 'recipe') params.set('fromRecipe', 'true');
      else if (source === 'inspiratie') params.set('fromInspiratie', 'true');
      else if (source === 'garden') params.set('fromGarden', 'true');
      else if (source === 'design') params.set('fromDesign', 'true');
      else if (source === 'product') params.set('fromProduct', 'true');
      
      if (data.category) {
        params.set('category', data.category);
      }

      router.push(`/sell/new?${params.toString()}`);
    }
  };

  if (photos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            📸 {t('productForm.selectPhotos')}
          </h1>
          <p className="text-gray-600 mb-6">
            {t('productForm.selectPhotosDescription', { 
              total: photos.length, 
              max: MAX_PHOTOS 
            })}
          </p>

          <div className="mb-6 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">
              {selectedPhotos.size} / {MAX_PHOTOS} {t('productForm.photosSelected')}
            </div>
            {selectedPhotos.size === MAX_PHOTOS && (
              <div className="text-sm text-orange-600 font-medium">
                {t('productForm.maxPhotosSelected')}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
            {photos.map((photo, index) => {
              const isSelected = selectedPhotos.has(index);
              const canSelect = selectedPhotos.size < MAX_PHOTOS || isSelected;

              return (
                <div
                  key={photo.id || index}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-200'
                      : canSelect
                      ? 'border-gray-200 hover:border-gray-300'
                      : 'border-gray-200 opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => canSelect && togglePhotoSelection(index)}
                >
                  {photo.type === 'video' ? (
                    <div className="relative w-full h-32 bg-gray-900">
                      {photo.thumbnail ? (
                        <img
                          src={photo.thumbnail}
                          alt={`Video ${index + 1}`}
                          className="w-full h-32 object-cover"
                        />
                      ) : (
                        <div className="w-full h-32 flex items-center justify-center bg-gray-800">
                          <span className="text-white text-2xl">▶️</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        Video
                      </div>
                    </div>
                  ) : (
                    <img
                      src={photo.url}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                  )}
                  
                  {/* Selection indicator */}
                  <div
                    className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-emerald-500 text-white'
                        : canSelect
                        ? 'bg-white/80 text-gray-600 group-hover:bg-white'
                        : 'bg-gray-400/80 text-white'
                    }`}
                  >
                    {isSelected ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-current rounded"></div>
                    )}
                  </div>

                  {/* Photo number */}
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('common.cancel') || 'Annuleren'}
            </button>
            <button
              onClick={continueToForm}
              disabled={selectedPhotos.size === 0}
              className={`px-6 py-3 rounded-lg text-white font-medium transition-colors flex-1 ${
                selectedPhotos.size === 0
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {t('productForm.continueToForm') || 'Doorgaan naar formulier'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SelectPhotosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    }>
      <SelectPhotosPageContent />
    </Suspense>
  );
}
