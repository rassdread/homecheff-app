'use client';
import * as React from 'react';
import { Upload, X, Camera, AlertTriangle } from 'lucide-react';
import { uploadProductImages } from '@/lib/upload';
import { useTranslation } from '@/hooks/useTranslation';

type Uploaded = { 
  url: string; 
  uploading?: boolean;
  error?: string;
};

type Props = {
  max?: number;
  value?: Uploaded[];
  onChange?: (files: Uploaded[]) => void;
  category?: string;
  productTitle?: string;
};

export default function SimpleImageUploader({ max = 10, value = [], onChange, category = 'CHEFF', productTitle }: Props) {
  const { t } = useTranslation();
  const [items, setItems] = React.useState<Uploaded[]>(value);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isInternalChange = React.useRef(false);

  // Sync with parent value prop
  React.useEffect(() => {
    if (!isInternalChange.current) {
      setItems(value);
    }
    isInternalChange.current = false;
  }, [value]);

  // Notify parent of changes, but avoid infinite loops
  React.useEffect(() => {
    if (onChange && isInternalChange.current) {
      onChange(items);
    }
  }, [items, onChange]);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    
    for (let i = 0; i < files.length; i++) {
      if (items.length >= max) break;
      const file = files[i];
      
      // Client-side validation
      if (!file.type.startsWith('image/')) {
        alert(t('upload.fileNotImage', { fileName: file.name }));
        continue;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        alert(t('upload.fileTooLargeWithName', { fileName: file.name, maxSize: 10 }));
        continue;
      }

      // Create temporary item with uploading state
      const tempItem: Uploaded = {
        url: '',
        uploading: true
      };

      isInternalChange.current = true;
      setItems(prev => [...prev, tempItem]);
      
      try {
        // Upload file directly
        const uploadResult = await uploadProductImages(file);
        
        if (uploadResult.success) {
          const newItem: Uploaded = {
            url: uploadResult.url
          };
          
          isInternalChange.current = true;
          setItems(prev => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].uploading) {
              updated[lastIndex] = newItem;
            }
            return updated;
          });
        } else {
          // Remove failed upload
          isInternalChange.current = true;
          setItems(prev => {
            const updated = [...prev];
            return updated.filter((item, index) => !(index === updated.length - 1 && item.uploading));
          });
          alert(t('upload.uploadFailedForFile', { fileName: file.name, error: uploadResult.error || '' }));
        }
      } catch (error) {
        console.error('Upload error:', error);
        // Remove failed upload
        isInternalChange.current = true;
        setItems(prev => {
          const updated = [...prev];
          return updated.filter((item, index) => !(index === updated.length - 1 && item.uploading));
        });
        alert(t('upload.uploadFailedForFileUnknown', { fileName: file.name }));
      }
    }
  };

  const removeAt = (idx: number) => {
    isInternalChange.current = true;
    const next = [...items];
    next.splice(idx, 1);
    setItems(next);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const canAddMore = items.length < max;

  return (
    <div className="space-y-4">
      {/* Upload section */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-2">
          {/* Gallery upload button */}
          <button
            type="button"
            onClick={openFileDialog}
            disabled={!canAddMore}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            <span className="hidden sm:inline">Foto's toevoegen</span>
            <span className="sm:hidden">Galerij</span>
          </button>
          
          {/* Camera button */}
          <label 
            htmlFor="simple-camera-upload"
            className="cursor-pointer inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Camera className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Camera</span>
            <span className="sm:hidden">📷</span>
          </label>
          
          <span className="text-sm text-gray-600">
            {items.length}/{max} foto's
          </span>
        </div>
        
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={(e) => handleFiles(e.target.files)}
          className="sr-only"
        />
        
        {/* Camera file input */}
        <input
          id="simple-camera-upload"
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          capture="environment"
          onChange={(e) => handleFiles(e.target.files)}
          className="sr-only"
        />
      </div>

      {/* Uploaded images */}
      {items.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <svg className="h-4 w-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span className="text-sm font-medium text-gray-700">
                Geüploade foto's ({items.length})
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {items.map((item, idx) => (
              <div key={idx} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  {item.uploading ? (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-xs text-gray-500">Uploaden...</p>
                      </div>
                    </div>
                  ) : item.error ? (
                    <div className="w-full h-full bg-red-50 flex items-center justify-center">
                      <div className="text-center text-red-600">
                        <AlertTriangle className="w-6 h-6 mx-auto mb-1" />
                        <p className="text-xs">Fout</p>
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={item.url} 
                      alt={`Foto ${idx + 1}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                      onError={(e) => {
                        console.error('Image failed to load:', item.url);
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                        e.currentTarget.style.display = 'flex';
                        e.currentTarget.style.alignItems = 'center';
                        e.currentTarget.style.justifyContent = 'center';
                        e.currentTarget.innerHTML = '<div class="text-gray-500 text-xs">Foto niet beschikbaar</div>';
                      }}
                    />
                  )}
                </div>
                
                {/* Remove button */}
                {!item.uploading && (
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    onClick={() => removeAt(idx)}
                    aria-label={t('common.removePhoto')}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info box - only show when no photos */}
      {items.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <Camera className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-medium">Foto's toevoegen</p>
              <p className="text-blue-700">
                Upload foto's van je product. Maximaal {max} foto's, maximaal 10MB per foto.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

