"use client";
import React, { useState } from "react";

interface ProductPhotoUploadProps {
  maxPhotos?: number;
  onPhotosChange?: (photos: File[]) => void;
}

export default function ProductPhotoUpload({ maxPhotos = 5, onPhotosChange }: ProductPhotoUploadProps) {
  const [photos, setPhotos] = useState<File[]>([]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>, idx: number) {
    if (e.target.files && e.target.files[0]) {
      const newPhotos = [...photos];
      newPhotos[idx] = e.target.files[0];
      const limitedPhotos = newPhotos.slice(0, maxPhotos);
      setPhotos(limitedPhotos);
      onPhotosChange?.(limitedPhotos);
    }
  }

  return (
    <div className="flex gap-4">
      {[...Array(maxPhotos)].map((_, idx) => (
        <label key={idx} className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center cursor-pointer" style={{ border: photos[idx] ? "2px solid var(--accent)" : undefined }}>
          {photos[idx] ? (
            <img src={URL.createObjectURL(photos[idx])} alt="Foto" className="w-full h-full object-cover rounded" />
          ) : (
            <span className="text-2xl text-gray-400">+</span>
          )}
          <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoChange(e, idx)} />
        </label>
      ))}
    </div>
  );
}
