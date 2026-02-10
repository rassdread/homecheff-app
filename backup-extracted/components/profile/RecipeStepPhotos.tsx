"use client";

import { useState } from "react";
import { Camera, X, Upload, Image as ImageIcon, Plus } from "lucide-react";
import { uploadFile } from "@/lib/upload";
// Image compression removed - using simple file size check instead

interface StepPhoto {
  id: string;
  url: string;
  stepNumber: number;
  description?: string;
  idx?: number;
}

interface RecipeStepPhotosProps {
  steps: string[];
  photos: StepPhoto[];
  onPhotosChange: (photos: StepPhoto[]) => void;
  maxPhotosPerStep?: number;
  maxTotalPhotos?: number;
}

export default function RecipeStepPhotos({ 
  steps, 
  photos, 
  onPhotosChange, 
  maxPhotosPerStep = 2,
  maxTotalPhotos = 10
}: RecipeStepPhotosProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  const handleFileUpload = async (files: FileList | null, stepNumber: number) => {
    if (!files || files.length === 0) return;
    
    const stepPhotos = photos.filter(p => p.stepNumber === stepNumber);
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`Bestand "${file.name}" is geen afbeelding.`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`Bestand "${file.name}" is te groot. Max 10MB.`);
        return false;
      }
      return true;
    }).slice(0, Math.min(maxPhotosPerStep - stepPhotos.length, maxTotalPhotos - photos.length));
    
    if (validFiles.length === 0) return;
    
    setUploading(true);

    const stepDescription = steps[stepNumber - 1] || `Stap ${stepNumber}`;
    const newPhotos: StepPhoto[] = validFiles.map((file, i) => ({
      id: `temp-${Date.now()}-${i}`,
      url: URL.createObjectURL(file),
      stepNumber: stepNumber,
      description: stepDescription,
      idx: stepPhotos.length + i
    }));
    
    onPhotosChange([...photos, ...newPhotos]);
    
    // Upload all files in parallel
    const uploadPromises = validFiles.map(async (file, i) => {
      const photoId = newPhotos[i].id;
      try {
        const result = await uploadFile(file, '/api/profile/recipes/photo/upload');
        if (result.success) {
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

  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, stepNumber: number) => {
    handleFileUpload(e.target.files, stepNumber);
    e.target.value = '';
  };

  const removePhoto = (photoId: string) => {
    const filteredPhotos = photos.filter(photo => photo.id !== photoId);
    onPhotosChange(filteredPhotos);
  };

  const updatePhotoDescription = (photoId: string, description: string) => {
    const updatedPhotos = photos.map(photo => 
      photo.id === photoId 
        ? { ...photo, description }
        : photo
    );
    onPhotosChange(updatedPhotos);
  };

  const getStepPhotos = (stepNumber: number) => {
    return photos.filter(photo => photo.stepNumber === stepNumber);
  };

  const getTotalPhotosForStep = (stepNumber: number) => {
    return photos.filter(photo => photo.stepNumber === stepNumber).length;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Stap-voor-stap Foto's</h3>
        <p className="text-sm text-gray-600">
          Voeg foto's toe bij elke stap van je recept. Dit maakt het recept duidelijker en aantrekkelijker.
        </p>
        <div className="mt-2 text-xs text-gray-500">
          <span className="font-medium">Limieten:</span> Max {maxPhotosPerStep} foto's per stap, {maxTotalPhotos} totaal
        </div>
      </div>

      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const stepPhotos = getStepPhotos(stepNumber);
        const canAddMore = stepPhotos.length < maxPhotosPerStep && photos.length < maxTotalPhotos;
        
        return (
          <div key={stepNumber} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start gap-4">
              {/* Step Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">
                    Stap {stepNumber}
                  </h4>
                  <div className="text-xs text-gray-500">
                    {stepPhotos.length}/{maxPhotosPerStep} foto's
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{step}</p>
              </div>

              {/* Step Photos - Small format next to step */}
              {stepPhotos.length > 0 && (
                <div className="flex gap-2 flex-shrink-0">
                  {stepPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative group w-16 h-16 bg-white rounded-lg overflow-hidden border border-gray-200"
                    >
                      <img
                        src={photo.url}
                        alt={`Stap ${stepNumber} foto`}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Action Buttons */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => removePhoto(photo.id)}
                          className="p-1 bg-white text-red-600 rounded-full hover:bg-red-50 transition-colors"
                          title="Verwijder foto"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      
                      {/* Upload Progress Indicator */}
                      {photo.url.startsWith('blob:') && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-2 w-2 border-b border-white"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Compact Add Photo Button */}
            {canAddMore && (
              <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                <div className="flex items-center space-x-3">
                  <input
                    id={`step-${stepNumber}-file-input`}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, stepNumber)}
                    className="sr-only"
                    disabled={uploading}
                  />
                  <label 
                    htmlFor={`step-${stepNumber}-file-input`}
                    className="cursor-pointer inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                        Uploaden...
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3 mr-1" />
                        Foto toevoegen
                      </>
                    )}
                  </label>
                  <span className="text-xs text-gray-500">
                    {stepPhotos.length}/{maxPhotosPerStep}
                  </span>
                </div>
              </div>
            )}

            {/* Step Complete Indicator */}
            {stepPhotos.length > 0 && (
              <div className="flex items-center gap-2 mt-2 text-xs text-emerald-600">
                <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                <span>Foto's toegevoegd aan deze stap</span>
              </div>
            )}
          </div>
        );
      })}

      {/* Summary */}
      <div className="bg-emerald-50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Camera className="w-5 h-5 text-emerald-600" />
          <span className="font-medium text-emerald-800">Foto Overzicht</span>
        </div>
        <div className="text-sm text-emerald-700">
          <div>Totaal foto's: {photos.length}/{maxTotalPhotos}</div>
          <div>Stappen met foto's: {new Set(photos.map(p => p.stepNumber)).size}/{steps.length}</div>
        </div>
      </div>
    </div>
  );
}

