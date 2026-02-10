'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, X, Camera, AlertCircle, CheckCircle } from 'lucide-react';
import { uploadFile } from '@/lib/upload';

interface WorkspacePhotoUploadProps {
  maxPhotos?: number;
  initialPhotos?: string[];
  onPhotosChange?: (photos: string[]) => void;
  className?: string;
  userType?: 'CHEFF' | 'GROWN' | 'DESIGNER' | 'SELLER';
}

interface PhotoItem {
  id: string;
  url: string;
  uploading?: boolean;
  error?: string;
}

export default function WorkspacePhotoUpload({ 
  maxPhotos = 10, 
  initialPhotos = [], 
  onPhotosChange,
  className = '',
  userType = 'SELLER'
}: WorkspacePhotoUploadProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>(
    initialPhotos.map(url => ({ id: crypto.randomUUID(), url }))
  );
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing photos on mount
  useEffect(() => {
    loadExistingPhotos();
  }, [userType]);

  const loadExistingPhotos = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/seller/workplace-photos');
      if (response.ok) {
        const data = await response.json();
        const rolePhotos = data.photos[userType] || [];
        const photoItems = rolePhotos.map((photo: any) => ({
          id: photo.id,
          url: photo.url
        }));
        setPhotos(photoItems);
        // Don't call onPhotosChange when loading existing photos
        // onPhotosChange?.(photoItems.map(p => p.url));
      }
    } catch (error) {
      console.error('Failed to load existing photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotosChange = (newPhotos: PhotoItem[]) => {
    setPhotos(newPhotos);
    // No need to call onPhotosChange since we upload directly
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    const remainingSlots = maxPhotos - photos.length;
    if (remainingSlots <= 0) {
      alert(`Maximum ${maxPhotos} foto's toegestaan`);
      return;
    }

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      // Client-side validation
      if (!file.type.startsWith('image/')) {
        alert(`Bestand "${file.name}" is geen afbeelding. Alleen afbeeldingen zijn toegestaan.`);
        return false;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        alert(`Bestand "${file.name}" is te groot. Maximum 10MB toegestaan.`);
        return false;
      }
      
      return true;
    }).slice(0, remainingSlots);
    
    if (validFiles.length === 0) return;

    setLoading(true);

    // Create placeholder photos immediately
    const tempPhotos: PhotoItem[] = validFiles.map(() => ({
      id: crypto.randomUUID(),
      url: '',
      uploading: true
    }));

    setPhotos(prevPhotos => [...prevPhotos, ...tempPhotos]);

    // Upload all files in parallel using Promise.all for speed
    const uploadPromises = validFiles.map(async (file, i) => {
      const tempId = tempPhotos[i].id;
      
      try {
        // Upload file directly to database
        const formData = new FormData();
        formData.append('photos', file);
        formData.append('role', userType);
        
        const response = await fetch('/api/seller/upload-workplace-photos', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const result = await response.json();

          return { 
            success: true, 
            tempId, 
            id: result.photos[0]?.id || tempId, 
            url: result.photos[0]?.fileUrl || '' 
          };
        } else {
          console.error(`Upload failed for ${file.name}`);
          return { success: false, tempId, error: 'Upload mislukt' };
        }
      } catch (error) {
        console.error(`Upload error for ${file.name}:`, error);
        return { success: false, tempId, error: String(error) };
      }
    });

    const results = await Promise.all(uploadPromises);

    // Update photos with results
    setPhotos(prevPhotos => {
      return prevPhotos.map(photo => {
        const result = results.find(r => r.tempId === photo.id);
        if (result?.success && result.url) {
          return { id: result.id, url: result.url };
        }
        return photo;
      }).filter(photo => {
        // Remove failed uploads
        const result = results.find(r => r.tempId === photo.id);
        // Keep photos that are not uploading anymore, or that succeeded
        return !('uploading' in photo) || !photo.uploading || (result && result.success);
      });
    });
    
    setLoading(false);
    
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    if (failedCount > 0) {
      alert(`${failedCount} foto('s) konden niet worden geüpload.`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const removePhoto = async (id: string) => {
    // If it's an existing photo (has a real ID), delete from database
    if (id.length > 20) { // Real UUID, not temp ID
      try {
        const response = await fetch(`/api/seller/workplace-photos/${id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          console.error('Failed to delete photo from database');
          return;
        }
      } catch (error) {
        console.error('Error deleting photo:', error);
        return;
      }
    }
    
    // Remove from local state
    setPhotos(prevPhotos => {
      const updatedPhotos = prevPhotos.filter(p => p.id !== id);
      return updatedPhotos;
    });
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const canAddMore = photos.length < maxPhotos;

  // Bepaal de juiste terminologie op basis van gebruikerstype
  const getWorkspaceTerminology = (type: string) => {
    switch (type) {
      case 'CHEFF':
        return { label: 'De Keuken', description: 'keuken foto\'s' };
      case 'GROWN':
        return { label: 'De Tuin', description: 'tuin foto\'s' };
      case 'DESIGNER':
        return { label: 'Het Atelier', description: 'atelier foto\'s' };
      default:
        return { label: 'Werkruimte', description: 'werkruimte foto\'s' };
    }
  };

  // Bepaal de instructietekst op basis van gebruikerstype
  const getWorkspaceInstructionText = (type: string) => {
    switch (type) {
      case 'CHEFF':
        return 'Toon je keuken en werkplek waar je gerechten bereidt';
      case 'GROWN':
        return 'Toon je tuin en kweekruimte waar je groenten en kruiden teelt';
      case 'DESIGNER':
        return 'Toon je atelier en creatieve ruimte waar je items maakt';
      default:
        return 'Toon je werkplek waar je producten maakt';
    }
  };

  const workspaceInfo = getWorkspaceTerminology(userType);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {workspaceInfo.label}
        </label>
        <span className="text-xs text-gray-500">
          {photos.length}/{maxPhotos} foto's
        </span>
      </div>

      {/* Upload Area */}
      {canAddMore && (
        <div
          className={`
            relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
            ${dragActive 
              ? 'border-primary-400 bg-primary-50' 
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFileDialog}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
          
          <div className="space-y-2">
            <Camera className="w-8 h-8 mx-auto text-gray-400" />
            <div className="text-sm text-gray-600">
              <p className="font-medium">Sleep foto's hierheen of klik om te uploaden</p>
              <p className="text-xs text-gray-500 mt-1">
                Maximaal {maxPhotos - photos.length} foto's meer
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                {photo.uploading ? (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
                      <p className="text-xs text-gray-500">Uploaden...</p>
                    </div>
                  </div>
                ) : (
                  <img
                    src={photo.url}
                    alt={`${workspaceInfo.description}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              
              {/* Remove Button */}
              {!photo.uploading && (
                <button
                  onClick={() => removePhoto(photo.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              
              {/* Status Indicator */}
              {photo.uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto mb-1"></div>
                    <p className="text-xs">Uploaden...</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• {getWorkspaceInstructionText(userType)}</p>
        <p>• Foto's helpen kopers vertrouwen te krijgen</p>
        <p>• Maximaal 10MB per foto</p>
        <p>• Alleen afbeeldingen (JPG, PNG, WebP)</p>
      </div>
    </div>
  );
}
