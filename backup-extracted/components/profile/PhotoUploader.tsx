// components/profile/PhotoUploader.tsx — CLIENT component
"use client";

import { useState } from "react";
import Image from "next/image";
import { uploadProfilePhoto } from "@/lib/upload";

export default function PhotoUploader({ initialUrl, onPhotoChange }: { initialUrl?: string; onPhotoChange?: (url: string | null) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(initialUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [hasNoPhoto, setHasNoPhoto] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const src = hasNoPhoto ? null : (preview ?? url ?? "/avatar-placeholder.png");

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
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

  function setNoPhoto() {
    setUrl(null);
    setPreview(null);
    setHasNoPhoto(true);
    onPhotoChange?.(null);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Profielfoto container */}
      <div className="relative">
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
          <div className="absolute inset-0 grid place-items-center text-emerald-800 font-medium transition-opacity opacity-0 hover:opacity-100">
            <div className="flex flex-col items-center gap-2">
              <label className="cursor-pointer whitespace-nowrap">
                {hasNoPhoto ? "Foto toevoegen" : "Foto wijzigen"}
                <input className="hidden" type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif" onChange={onFileChange} />
              </label>
              <button
                onClick={setNoPhoto}
                disabled={uploading}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Geen foto
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {uploading && (
        <div className="text-sm text-gray-500">Uploaden...</div>
      )}
    </div>
  );
}
