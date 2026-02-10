// components/profile/PhotoUploader.tsx — CLIENT component
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { uploadProfilePhoto } from "@/lib/upload";
import { useTranslation } from '@/hooks/useTranslation';

export default function PhotoUploader({ initialUrl, onPhotoChange }: { initialUrl?: string; onPhotoChange?: (url: string | null) => void }) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(initialUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [hasNoPhoto, setHasNoPhoto] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const src = hasNoPhoto ? null : (preview ?? url ?? "/avatar-placeholder.png");

  async function handleFile(file: File) {
    if (!file) return;
    
    // Client-side validation
    if (!file.type.startsWith('image/')) {
      alert(t('upload.onlyImagesAllowed'));
      return;
    }
    
    // Check for specific image formats
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      alert(t('errors.onlyImagesAllowed'));
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB
      alert(t('errors.fileTooLarge'));
      return;
    }
    
    setUploading(true);
    setHasNoPhoto(false); // Reset geen foto status
    
    // Instant preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    try {
      // Upload file directly
      const result = await uploadProfilePhoto(file);
      
      if (result.success) {
        setUrl(result.url);
        setPreview(null); // Clear preview since we now have the actual URL
        onPhotoChange?.(result.url);
      } else {
        alert(`Foto upload mislukt: ${result.error}`);
        setPreview(null); // Clear preview on error
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload van profielfoto mislukt: ${error}`);
      setPreview(null);
    }
    
    setUploading(false);
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
    e.target.value = ''; // Reset input
  }

  async function onCameraChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
    e.target.value = ''; // Reset input
  }

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const openCameraDialog = () => {
    cameraInputRef.current?.click();
  };

  function setNoPhoto() {
    setUrl(null);
    setPreview(null);
    setHasNoPhoto(true);
    onPhotoChange?.(null);
  }

  // Prevent event bubbling
  const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Profielfoto container */}
      <div className="relative group">
        <div className="relative rounded-full overflow-hidden border-2 border-emerald-700/60 shadow-sm"
             style={{ width: "192px", height: "192px" }}>
          {src ? (
            <Image src={src} alt="Profielfoto" fill className="object-cover" sizes="192px" />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <div className="text-gray-400 text-center">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="text-xs">Geen foto</p>
              </div>
            </div>
          )}
          {/* Hover overlay met icon indicator */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full">
            <div className="bg-white/90 rounded-full p-3 shadow-lg">
              <Camera className="w-6 h-6 text-emerald-700" />
            </div>
          </div>
        </div>
        
        {/* Action buttons - buiten de foto, onder of naast */}
        <div className="mt-3 flex flex-col items-center gap-2 w-full">
          <div className="flex gap-2 justify-center">
            <button
              onClick={(e) => handleButtonClick(e, openFileDialog)}
              disabled={uploading}
              className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-95"
            >
              {hasNoPhoto ? "Foto toevoegen" : "Wijzigen"}
            </button>
            <button
              onClick={(e) => handleButtonClick(e, openCameraDialog)}
              disabled={uploading}
              className="px-4 py-2 text-sm font-medium bg-white text-emerald-700 border-2 border-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-95 flex items-center gap-1.5"
              title={t('common.camera')}
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Camera</span>
            </button>
          </div>
          {src && !hasNoPhoto && (
            <button
              onClick={(e) => handleButtonClick(e, setNoPhoto)}
              disabled={uploading}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Foto verwijderen
            </button>
          )}
        </div>
        
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={onFileChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          capture="environment"
          onChange={onCameraChange}
          className="hidden"
        />
      </div>
      
      {uploading && (
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Uploaden...
        </div>
      )}
    </div>
  );
}
