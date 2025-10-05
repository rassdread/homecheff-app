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
    if (stepPhotos.length >= maxPhotosPerStep) {
      alert(`Maximum ${maxPhotosPerStep} foto's per stap toegestaan`);
      return;
    }
    
    if (photos.length >= maxTotalPhotos) {
      alert(`Maximum ${maxTotalPhotos} foto's totaal toegestaan`);
      return;
    }
    
    setUploading(true);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Client-side validation
      if (!file.type.startsWith('image/')) {
        alert(`Bestand "${file.name}" is geen afbeelding. Alleen afbeeldingen zijn toegestaan.`);
        continue;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        alert(`Bestand "${file.name}" is te groot. Maximum 10MB toegestaan.`);
        continue;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      
      // Add photo with preview
      const stepPhotos = photos.filter(p => p.stepNumber === stepNumber);
      // Get the actual step description from the steps array
      const stepDescription = steps[stepNumber - 1] || `Stap ${stepNumber}`;
      const newPhoto: StepPhoto = {
        id: `temp-${Date.now()}-${i}`,
        url: previewUrl,
        stepNumber: stepNumber,
        description: stepDescription,
        idx: stepPhotos.length
      };
      
      const updatedPhotos = [...photos, newPhoto];
      onPhotosChange(updatedPhotos);
      
      // Upload file directly
      try {
        const result = await uploadFile(file, '/api/profile/recipes/photo/upload');
        
        if (result.success) {
          // Update photo with actual URL
          onPhotosChange(
            updatedPhotos.map(photo => 
              photo.id === newPhoto.id 
                ? { ...photo, url: result.url }
                : photo
            )
          );
        } else {
          // Remove photo on upload failure
          onPhotosChange(updatedPhotos.filter(photo => photo.id !== newPhoto.id));
          console.error(`Upload failed for ${file.name}:`, result.error);
          // Don't show alert for Vercel Blob suspended error, as fallback should work
          if (!result.error?.includes('suspended')) {
            alert(`Upload van "${file.name}" mislukt: ${result.error}`);
          }
        }
      } catch (error) {
        // Remove photo on error
        onPhotosChange(updatedPhotos.filter(photo => photo.id !== newPhoto.id));
        console.error(`Upload error for ${file.name}:`, error);
        // Don't show alert for network errors, as fallback should work
        if (!(error instanceof Error && error.message.includes('fetch'))) {
          alert(`Upload van "${file.name}" mislukt: ${error}`);
        }
      }
    }
    
    setUploading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, stepNumber: number) => {
    handleFileUpload(e.target.files, stepNumber);
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

