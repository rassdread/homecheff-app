"use client";
import React, { useState } from "react";
import { Upload, X, Camera } from "lucide-react";
import { uploadFile } from "@/lib/upload";

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
  const [photos, setPhotos] = useState<ProductPhoto[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const remainingSlots = maxPhotos - photos.length;
    if (remainingSlots <= 0) {
      alert(`Maximum ${maxPhotos} foto's toegestaan`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    for (const file of filesToUpload) {
      // Client-side validation
      if (!file.type.startsWith('image/')) {
        alert(`Bestand "${file.name}" is geen afbeelding. Alleen afbeeldingen zijn toegestaan.`);
        continue;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        alert(`Bestand "${file.name}" is te groot. Maximum 10MB toegestaan.`);
        continue;
      }

      const tempId = crypto.randomUUID();
      const tempPhoto: ProductPhoto = {
        id: tempId,
        url: '',
        uploading: true
      };

      // Add uploading placeholder
      setPhotos(prevPhotos => {
        const updatedPhotos = [...prevPhotos, tempPhoto];
        onPhotosChange?.(updatedPhotos);
        return updatedPhotos;
      });

      try {
        // Upload file directly
        const result = await uploadFile(file, '/api/upload');
        
        if (result.success) {
          // Replace uploading placeholder with uploaded photo
          setPhotos(prevPhotos => {
            const updatedPhotos = prevPhotos.map(p => 
              p.id === tempId 
                ? { id: crypto.randomUUID(), url: result.url }
                : p
            );
            onPhotosChange?.(updatedPhotos);
            return updatedPhotos;
          });
        } else {
          // Remove failed upload
          setPhotos(prevPhotos => {
            const updatedPhotos = prevPhotos.filter(p => p.id !== tempId);
            onPhotosChange?.(updatedPhotos);
            return updatedPhotos;
          });
          alert(`Upload van "${file.name}" mislukt: ${result.error}`);
        }
        
      } catch (error) {
        // Remove failed upload
        setPhotos(prevPhotos => {
          const updatedPhotos = prevPhotos.filter(p => p.id !== tempId);
          onPhotosChange?.(updatedPhotos);
          return updatedPhotos;
        });
        alert(`Upload van "${file.name}" mislukt: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
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
          <div className="flex items-center space-x-3">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="sr-only"
              id="product-photos-input"
              disabled={uploading}
            />
            <label 
              htmlFor="product-photos-input"
              className="cursor-pointer inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    aria-label="Verwijder foto"
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
