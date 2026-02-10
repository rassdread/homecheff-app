"use client";
import React, { useState, useRef } from "react";
import { Upload, X, Camera } from "lucide-react";
import { uploadFile } from "@/lib/upload";
import { useTranslation } from '@/hooks/useTranslation';

interface ProductPhoto {
  id: string;
  url: string;
  uploading?: boolean;
  error?: string;
}

interface ProductPhotoUploadProps {
  maxPhotos?: number;
  onPhotosChange?: (photos: ProductPhoto[]) => void;
  initialPhotos?: ProductPhoto[];
}

export default function ProductPhotoUpload({ 
  maxPhotos = 5, 
  onPhotosChange, 
  initialPhotos = [] 
}: ProductPhotoUploadProps) {
  const { t } = useTranslation();
  const [photos, setPhotos] = useState<ProductPhoto[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const remainingSlots = maxPhotos - photos.length;
    if (remainingSlots <= 0) {
      alert(t('upload.maxPhotosReached', { maxPhotos }));
      return;
    }

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      // Client-side validation
      if (!file.type.startsWith('image/')) {
        alert(t('upload.fileNotImage', { fileName: file.name }));
        return false;
      }
      
      // Check for specific image formats
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        alert(t('upload.fileInvalidFormat', { fileName: file.name }));
        return false;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        alert(t('upload.fileTooLargeWithName', { fileName: file.name, maxSize: 10 }));
        return false;
      }
      
      return true;
    }).slice(0, remainingSlots);
    
    if (validFiles.length === 0) return;

    setUploading(true);
    // Create placeholder photos immediately
    const tempPhotos: ProductPhoto[] = validFiles.map(() => ({
      id: crypto.randomUUID(),
      url: '',
      uploading: true
    }));

    setPhotos(prevPhotos => {
      const updatedPhotos = [...prevPhotos, ...tempPhotos];
      onPhotosChange?.(updatedPhotos);
      return updatedPhotos;
    });

    // Upload all files in parallel using Promise.all for speed
    const uploadPromises = validFiles.map(async (file, i) => {
      const tempId = tempPhotos[i].id;
      
      try {
        const result = await uploadFile(file, '/api/upload');
        
        if (result.success) {
          return { success: true, tempId, url: result.url };
        } else {
          console.error(`Upload failed for ${file.name}:`, result.error);
          return { success: false, tempId, error: result.error };
        }
      } catch (error) {
        console.error(`Upload error for ${file.name}:`, error);
        return { success: false, tempId, error: String(error) };
      }
    });

    const results = await Promise.all(uploadPromises);

    // Update photos with results
    setPhotos(prevPhotos => {
      const updatedPhotos = prevPhotos.map(photo => {
        const result = results.find(r => r.tempId === photo.id);
        if (result?.success && result.url) {
          return { id: crypto.randomUUID(), url: result.url };
        }
        return photo;
      }).filter(photo => {
        // Remove failed uploads
        const result = results.find(r => r.tempId === photo.id);
        return !photo.uploading || (result && result.success);
      });
      
      onPhotosChange?.(updatedPhotos);
      return updatedPhotos;
    });
    
    setUploading(false);
    
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    if (failedCount > 0) {
      alert(t('upload.photosCouldNotUpload', { count: failedCount }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
    e.target.value = ''; // Reset input to allow re-uploading same files
  };

  const handleCameraSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
    e.target.value = ''; // Reset input to allow re-uploading same files
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const openCameraDialog = () => {
    cameraInputRef.current?.click();
  };

  const removePhoto = (photoId: string) => {
    setPhotos(prevPhotos => {
      const updatedPhotos = prevPhotos.filter(p => p.id !== photoId);
      onPhotosChange?.(updatedPhotos);
      return updatedPhotos;
    });
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Foto's
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Upload maximaal {maxPhotos} foto's van je product.
        </p>
      </div>

      {/* Upload section */}
      {canAddMore && (
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

      {/* Photo Grid */}
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
                {photo.uploading ? (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto mb-2"></div>
                      <p className="text-xs text-gray-500">Uploaden...</p>
                    </div>
                  </div>
                ) : (
                  <img
                    src={photo.url}
                    alt={`Product foto ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      console.error('Product photo failed to load:', photo.url);
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                      e.currentTarget.style.display = 'flex';
                      e.currentTarget.style.alignItems = 'center';
                      e.currentTarget.style.justifyContent = 'center';
                      e.currentTarget.innerHTML = '<div class="text-gray-500 text-xs">Foto niet beschikbaar</div>';
                    }}
                  />
                )}
                
                {/* Remove button */}
                {!photo.uploading && (
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removePhoto(photo.id)}
                    aria-label={t('common.removePhoto')}
                  >
                    <X className="w-3 h-3" />
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
          <p className="text-xs">Upload foto's van je product om het visueel aantrekkelijk te maken</p>
        </div>
      )}
    </div>
  );
}
