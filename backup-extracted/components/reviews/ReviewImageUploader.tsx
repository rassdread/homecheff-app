'use client';

import React, { useState } from 'react';
import { Upload, X, Camera, Image as ImageIcon } from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';

interface ReviewImageUploaderProps {
  value: { url: string }[];
  onChange: (images: { url: string }[]) => void;
  maxImages?: number;
}

export default function ReviewImageUploader({ 
  value = [], 
  onChange, 
  maxImages = 5 
}: ReviewImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remainingSlots = maxImages - value.length;
    const filesToProcess = fileArray.slice(0, remainingSlots);

    if (filesToProcess.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = filesToProcess.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'review');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        return { url: data.url };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      onChange([...value, ...uploadedImages]);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Er ging iets mis bij het uploaden van de foto\'s');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const removeImage = (index: number) => {
    const newImages = value.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const canAddMore = value.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canAddMore && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="space-y-2">
            <ImageIcon className="w-8 h-8 text-gray-400 mx-auto" />
            <div className="text-sm text-gray-600">
              <label className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                Klik om foto's te selecteren
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                  className="hidden"
                />
              </label>
              <span> of sleep ze hierheen</span>
            </div>
            <p className="text-xs text-gray-500">
              PNG, JPG tot 5MB ({value.length}/{maxImages})
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {uploading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Uploaden...</span>
        </div>
      )}

      {/* Image Preview */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {value.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <SafeImage
                  src={image.url}
                  alt={`Review foto ${index + 1}`}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



