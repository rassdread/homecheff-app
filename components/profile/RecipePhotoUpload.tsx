import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, X, ImageIcon } from 'lucide-react';
import { uploadFile } from '@/lib/upload';
import { useTranslation } from '@/hooks/useTranslation';

export interface RecipePhoto {
  id: string;
  url: string;
  isMain?: boolean;
}

interface RecipePhotoUploadProps {
  photos: RecipePhoto[];
  onPhotosChange: (photos: RecipePhoto[]) => void;
  maxPhotos?: number;
}

export default function RecipePhotoUpload({ 
  photos, 
  onPhotosChange, 
  maxPhotos = 5 
}: RecipePhotoUploadProps) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Debug: Log photos when they change
  useEffect(() => {
    console.log('=== RecipePhotoUpload: Photos received ===');
    console.log('Photos array:', photos);
    console.log('Photos count:', photos.length);
    photos.forEach((photo, index) => {
      console.log(`Photo ${index}:`, {
        id: photo.id,
        url: photo.url?.substring(0, 50) + '...',
        isMain: photo.isMain,
        hasUrl: !!photo.url
      });
    });
  }, [photos]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      // Client-side validation
      if (!file.type.startsWith('image/')) {
        alert(`Bestand "${file.name}" is geen afbeelding. Alleen afbeeldingen zijn toegestaan.`);
        return false;
      }
      
      // Check for specific image formats
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        alert(`Bestand "${file.name}" heeft een ongeldig formaat. Alleen JPG, PNG, WebP en GIF zijn toegestaan.`);
        return false;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        alert(`Bestand "${file.name}" is te groot. Maximum 10MB toegestaan.`);
        return false;
      }
      return true;
    }).slice(0, maxPhotos - photos.length);
    
    if (validFiles.length === 0) return;
    if (photos.length + validFiles.length > maxPhotos) {
      alert(`Je kunt maximaal ${maxPhotos} foto's uploaden. Er zijn ${maxPhotos - photos.length} plekken beschikbaar.`);
    }
    
    setUploading(true);

    // Create preview photos immediately
    const newPhotos: RecipePhoto[] = validFiles.map((file, i) => ({
      id: `temp-${Date.now()}-${i}`,
      url: URL.createObjectURL(file),
      isMain: photos.length === 0 && i === 0
    }));
    
    onPhotosChange([...photos, ...newPhotos]);
    
    // Upload all files in parallel
    const uploadPromises = validFiles.map(async (file, i) => {
      const photoId = newPhotos[i].id;
      setUploadProgress(prev => ({ ...prev, [photoId]: 0 }));
      
      try {
        const result = await uploadFile(file, '/api/profile/recipes/photo/upload');
        
        if (result.success) {
          setUploadProgress(prev => ({ ...prev, [photoId]: 100 }));
          return { success: true, photoId, url: result.url };
        } else {
          console.error(`Upload failed for ${file.name}:`, result.error);
          return { success: false, photoId, error: result.error };
        }
      } catch (error) {
        console.error(`Upload error for ${file.name}:`, error);
        return { success: false, photoId, error: String(error) };
      }
    });
    
    const results = await Promise.all(uploadPromises);
    
    // Update photos with results
    onPhotosChange([...photos, ...newPhotos].map(photo => {
      const result = results.find(r => r.photoId === photo.id);
      if (result?.success && result.url) {
        return { ...photo, url: result.url };
      }
      return photo;
    }).filter(photo => {
      const result = results.find(r => r.photoId === photo.id);
      return !result || result.success;
    }));
    
    setUploading(false);
    setUploadProgress({});
    
    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {

    }

  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
    e.target.value = '';
  };

  const handleCameraSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
    e.target.value = '';
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const openCameraDialog = () => {
    cameraInputRef.current?.click();
  };

  const removePhoto = (photoId: string) => {
    onPhotosChange(photos.filter(photo => photo.id !== photoId));
  };

  const setMainPhoto = (photoId: string) => {
    const updatedPhotos = photos.map(photo => ({
      ...photo,
      isMain: photo.id === photoId
    }));
    onPhotosChange(updatedPhotos);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Hoofdfoto's van het Recept
        </label>
        <p className="text-xs text-gray-500 mb-3">
          📎 Upload meerdere foto's tegelijk of sleep ze hierheen (max {maxPhotos})
        </p>
      </div>

      {/* Upload section */}
      {photos.length < maxPhotos && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-2">
            {/* Gallery upload button */}
            <button
              type="button"
              onClick={openFileDialog}
              disabled={uploading}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploaden...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Foto's toevoegen</span>
                  <span className="sm:hidden">Galerij</span>
                </>
              )}
            </button>
            
            {/* Camera button */}
            <button
              type="button"
              onClick={openCameraDialog}
              disabled={uploading}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Camera className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Camera</span>
              <span className="sm:hidden">📷</span>
            </button>
            
            <span className="text-sm text-gray-600">
              {photos.length}/{maxPhotos} foto's
            </span>
          </div>
          
          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            id="main-photos-file-input"
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="sr-only"
            disabled={uploading}
          />
          
          {/* Camera file input */}
          <input
            ref={cameraInputRef}
            id="main-photos-camera-input"
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            capture="environment"
            onChange={handleCameraSelect}
            className="sr-only"
            disabled={uploading}
          />
        </div>
      )}

      {/* Photo Grid - compact */}
      {photos.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <svg className="h-4 w-4 text-emerald-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span className="text-sm font-medium text-gray-700">
              Geüploade foto's ({photos.length})
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200"
              >
                <img
                  src={photo.url}
                  alt={`Recept foto ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    console.error('Recipe photo failed to load:', photo.url);
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                    e.currentTarget.style.display = 'flex';
                    e.currentTarget.style.alignItems = 'center';
                    e.currentTarget.style.justifyContent = 'center';
                    e.currentTarget.innerHTML = '<div class="text-gray-500 text-xs">Foto niet beschikbaar</div>';
                  }}
                  onLoad={() => console.log('Recipe photo loaded:', photo.url.substring(0, 50))}
                />
                
                {/* Main photo indicator */}
                {photo.isMain && (
                  <div className="absolute top-1 left-1 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">
                    Hoofd
                  </div>
                )}
                
                {/* Remove button */}
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removePhoto(photo.id)}
                  aria-label={t('common.removePhoto')}
                >
                  ×
                </button>
                
                {/* Set as main button */}
                {!photo.isMain && (
                  <button
                    type="button"
                    className="absolute bottom-1 left-1 bg-emerald-500 text-white text-xs px-2 py-1 rounded hover:bg-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setMainPhoto(photo.id)}
                  >
                    Hoofd
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {photos.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Camera className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Nog geen foto's toegevoegd</p>
          <p className="text-xs">Upload foto's van je recept om het visueel aantrekkelijk te maken</p>
        </div>
      )}
    </div>
  );
}