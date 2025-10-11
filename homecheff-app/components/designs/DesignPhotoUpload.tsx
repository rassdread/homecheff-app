import React, { useState } from 'react';
import { Upload, Camera, X } from 'lucide-react';
import { uploadFile } from '@/lib/upload';

export interface DesignPhoto {
  id: string;
  url: string;
  isMain?: boolean;
  description?: string;
}

interface DesignPhotoUploadProps {
  photos: DesignPhoto[];
  onPhotosChange: (photos: DesignPhoto[]) => void;
  maxPhotos?: number;
}

export default function DesignPhotoUpload({ 
  photos, 
  onPhotosChange, 
  maxPhotos = 10 
}: DesignPhotoUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.size > 10 * 1024 * 1024) {
        alert(`Bestand "${file.name}" is te groot. Maximum 10MB toegestaan.`);
        continue;
      }
      
      if (photos.length >= maxPhotos) {
        alert(`Maximum ${maxPhotos} foto's toegestaan.`);
        break;
      }
      
      const previewUrl = URL.createObjectURL(file);
      
      const newPhoto: DesignPhoto = {
        id: `temp-${Date.now()}-${i}`,
        url: previewUrl,
        isMain: photos.length === 0
      };
      
      const updatedPhotos = [...photos, newPhoto];
      onPhotosChange(updatedPhotos);
      
      try {
        const result = await uploadFile(file, '/api/upload');
        
        if (result.success) {
          onPhotosChange(
            updatedPhotos.map(photo => 
              photo.id === newPhoto.id 
                ? { ...photo, url: result.url }
                : photo
            )
          );
        } else {
          onPhotosChange(updatedPhotos.filter(photo => photo.id !== newPhoto.id));
          console.error(`Upload failed for ${file.name}:`, result.error);
          if (!result.error?.includes('suspended')) {
            alert(`Upload van "${file.name}" mislukt: ${result.error}`);
          }
        }
      } catch (error) {
        onPhotosChange(updatedPhotos.filter(photo => photo.id !== newPhoto.id));
        console.error(`Upload error for ${file.name}:`, error);
        if (!(error instanceof Error && error.message.includes('fetch'))) {
          alert(`Upload van "${file.name}" mislukt: ${error}`);
        }
      }
    }
    
    setUploading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
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
          Foto's van je Design
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Upload maximaal {maxPhotos} foto's van je creatie. De eerste foto wordt de hoofdfoto.
        </p>
      </div>

      {/* Compact upload section */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center space-x-3">
          <input
            id="design-photos-file-input"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="sr-only"
            disabled={uploading}
          />
          <label 
            htmlFor="design-photos-file-input"
            className="cursor-pointer inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploaden...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Foto's toevoegen
              </>
            )}
          </label>
          <span className="text-sm text-gray-600">
            {photos.length}/{maxPhotos} foto's
          </span>
        </div>
      </div>

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <svg className="h-4 w-4 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  alt={`Design foto ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                
                {/* Main photo indicator */}
                {photo.isMain && (
                  <div className="absolute top-1 left-1 bg-yellow-600 text-white text-xs px-2 py-1 rounded-full">
                    Hoofd
                  </div>
                )}
                
                {/* Remove button */}
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removePhoto(photo.id)}
                  aria-label="Verwijder foto"
                >
                  ×
                </button>
                
                {/* Set as main button */}
                {!photo.isMain && (
                  <button
                    type="button"
                    className="absolute bottom-1 left-1 bg-yellow-600 text-white text-xs px-2 py-1 rounded hover:bg-yellow-700 opacity-0 group-hover:opacity-100 transition-opacity"
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
          <p className="text-xs">Upload foto's van je design om het visueel aantrekkelijk te maken</p>
        </div>
      )}
    </div>
  );
}

