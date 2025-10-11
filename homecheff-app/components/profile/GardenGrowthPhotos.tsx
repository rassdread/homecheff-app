"use client";

import { useState } from "react";
import { Camera, X, Upload, Plus, Sprout, Leaf, Flower } from "lucide-react";
import { uploadFile } from "@/lib/upload";

interface GrowthPhoto {
  id: string;
  url: string;
  phaseNumber: number;
  description?: string;
  idx?: number;
}

interface GardenGrowthPhotosProps {
  phases: { name: string; description: string }[];
  photos: GrowthPhoto[];
  onPhotosChange: (photos: GrowthPhoto[]) => void;
  maxPhotosPerPhase?: number;
  maxTotalPhotos?: number;
}

const PHASE_ICONS = {
  0: Sprout,  // Zaaien
  1: Leaf,    // Kiemen
  2: Sprout,  // Groeien
  3: Flower,  // Bloeien
  4: Camera   // Oogsten/Resultaat
};

export default function GardenGrowthPhotos({ 
  phases, 
  photos, 
  onPhotosChange, 
  maxPhotosPerPhase = 3,
  maxTotalPhotos = 15
}: GardenGrowthPhotosProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (files: FileList | null, phaseNumber: number) => {
    if (!files || files.length === 0) return;
    
    const phasePhotos = photos.filter(p => p.phaseNumber === phaseNumber);
    if (phasePhotos.length >= maxPhotosPerPhase) {
      alert(`Maximum ${maxPhotosPerPhase} foto's per fase toegestaan`);
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
      const phasePhotosCount = photos.filter(p => p.phaseNumber === phaseNumber);
      const phase = phases[phaseNumber];
      const newPhoto: GrowthPhoto = {
        id: `temp-${Date.now()}-${i}`,
        url: previewUrl,
        phaseNumber: phaseNumber,
        description: '', // Start empty, user can add description
        idx: phasePhotosCount.length
      };
      
      const updatedPhotos = [...photos, newPhoto];
      onPhotosChange(updatedPhotos);
      
      // Upload file directly
      try {
        const result = await uploadFile(file, '/api/profile/garden/photo/upload');
        
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
          if (!result.error?.includes('suspended')) {
            alert(`Upload van "${file.name}" mislukt: ${result.error}`);
          }
        }
      } catch (error) {
        // Remove photo on error
        onPhotosChange(updatedPhotos.filter(photo => photo.id !== newPhoto.id));
        console.error(`Upload error for ${file.name}:`, error);
        if (!(error instanceof Error && error.message.includes('fetch'))) {
          alert(`Upload van "${file.name}" mislukt: ${error}`);
        }
      }
    }
    
    setUploading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, phaseNumber: number) => {
    handleFileUpload(e.target.files, phaseNumber);
  };

  const removePhoto = (photoId: string) => {
    const filteredPhotos = photos.filter(photo => photo.id !== photoId);
    onPhotosChange(filteredPhotos);
  };

  const getPhasePhotos = (phaseNumber: number) => {
    return photos.filter(photo => photo.phaseNumber === phaseNumber);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Groeifasen Foto's</h3>
        <p className="text-sm text-gray-600">
          Documenteer de groei van je plant met foto's per fase. Dit maakt je kweekdagboek compleet!
        </p>
        <div className="mt-2 text-xs text-gray-500">
          <span className="font-medium">Limieten:</span> Max {maxPhotosPerPhase} foto's per fase, {maxTotalPhotos} totaal
        </div>
      </div>

      {phases.map((phase, index) => {
        const phaseNumber = index;
        const phasePhotos = getPhasePhotos(phaseNumber);
        const canAddMore = phasePhotos.length < maxPhotosPerPhase && photos.length < maxTotalPhotos;
        const IconComponent = PHASE_ICONS[index as keyof typeof PHASE_ICONS] || Camera;
        
        return (
          <div key={phaseNumber} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-start gap-4">
              {/* Phase Icon */}
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-full flex items-center justify-center shadow-md">
                <IconComponent className="w-5 h-5" />
              </div>

              {/* Phase Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      {phase.name}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">{phase.description}</p>
                  </div>
                  <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border border-gray-200">
                    {phasePhotos.length}/{maxPhotosPerPhase} foto's
                  </div>
                </div>
              </div>

            </div>

            {/* Phase Photos Grid - Below phase header */}
            {phasePhotos.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                {phasePhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative group bg-white rounded-lg overflow-hidden border-2 border-green-300 shadow-sm"
                  >
                    <div className="aspect-square relative">
                      <img
                        src={photo.url}
                        alt={photo.description || `${phase.name} foto`}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Action Buttons */}
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => removePhoto(photo.id)}
                          className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
                          title="Verwijder foto"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      
                      {/* Upload Progress Indicator */}
                      {photo.url.startsWith('blob:') && (
                        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                          <div className="text-center text-white">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                            <p className="text-xs">Uploaden...</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Photo Description */}
                    <div className="p-2">
                      <input
                        type="text"
                        value={photo.description || ''}
                        onChange={(e) => {
                          const updatedPhotos = photos.map(p => 
                            p.id === photo.id ? { ...p, description: e.target.value } : p
                          );
                          onPhotosChange(updatedPhotos);
                        }}
                        placeholder="Beschrijving (optioneel)"
                        className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Compact Add Photo Button */}
            {canAddMore && (
              <div className="flex items-center justify-between p-2 bg-white rounded border border-green-200 mt-3">
                <div className="flex items-center space-x-3">
                  <input
                    id={`phase-${phaseNumber}-file-input`}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, phaseNumber)}
                    className="sr-only"
                    disabled={uploading}
                  />
                  <label 
                    htmlFor={`phase-${phaseNumber}-file-input`}
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
                    {phasePhotos.length}/{maxPhotosPerPhase}
                  </span>
                </div>
              </div>
            )}

            {/* Phase Complete Indicator */}
            {phasePhotos.length > 0 && (
              <div className="flex items-center gap-2 mt-2 text-xs text-emerald-600">
                <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                <span>Foto's toegevoegd aan deze fase</span>
              </div>
            )}
          </div>
        );
      })}

      {/* Summary */}
      <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
        <div className="flex items-center gap-2 mb-2">
          <Camera className="w-5 h-5 text-emerald-600" />
          <span className="font-medium text-emerald-800">Foto Overzicht</span>
        </div>
        <div className="text-sm text-emerald-700">
          <div>Totaal foto's: {photos.length}/{maxTotalPhotos}</div>
          <div>Fasen met foto's: {new Set(photos.map(p => p.phaseNumber)).size}/{phases.length}</div>
        </div>
      </div>
    </div>
  );
}

