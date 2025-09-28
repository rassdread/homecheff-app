
'use client';
import * as React from 'react';
import ImageModeration from '../moderation/ImageModeration';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { uploadProductImages } from '@/lib/upload';

type Uploaded = { 
  url: string; 
  moderationResult?: any;
  isModerated?: boolean;
  isApproved?: boolean;
};

type Props = {
  max?: number;
  value?: Uploaded[];
  onChange?: (files: Uploaded[]) => void;
  category?: string;
  productTitle?: string;
};

export default function MultiImageUploader({ max = 10, value = [], onChange, category = 'CHEFF', productTitle }: Props) {
  const [items, setItems] = React.useState<Uploaded[]>(value);
  const [moderatingFiles, setModeratingFiles] = React.useState<Map<string, File>>(new Map());
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
        alert(`Bestand "${file.name}" is geen afbeelding. Alleen afbeeldingen zijn toegestaan.`);
        continue;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        alert(`Bestand "${file.name}" is te groot. Maximum 10MB toegestaan.`);
        continue;
      }
      
      // Add file for moderation (not uploaded yet)
      setModeratingFiles(prev => {
        const newMap = new Map(prev).set(file.name, file);
        return newMap;
      });
    }
  };

  const handleModerationComplete = async (file: File, result: any) => {
    // Check if this file is already being processed
    if (!moderatingFiles.has(file.name)) {
      return;
    }
    
    // Upload file only after successful moderation
    if (result.isAppropriate && result.isValidForCategory) {
      try {
        // Upload file directly
        const uploadResult = await uploadProductImages(file);
        
        if (uploadResult.success) {
          const newItem: Uploaded = {
            url: uploadResult.url,
            moderationResult: result,
            isModerated: true,
            isApproved: true
          };
          
          isInternalChange.current = true;
          setItems(prev => {
            // Check if this URL already exists in current state
            if (prev.some(item => item.url === newItem.url)) {
              return prev; // Return unchanged state
            }
            
            return [...prev, newItem];
          });
        } else {
          alert(`Upload van "${file.name}" mislukt: ${uploadResult.error}`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert(`Upload van "${file.name}" mislukt: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
      }
    } else {
      // File rejected by moderation
      alert(`Foto "${file.name}" is afgewezen: ${result.suggestions?.join(', ') || 'Ongepaste inhoud'}`);
    }
    
    // Remove from moderating files
    setModeratingFiles(prev => {
      const newMap = new Map(prev);
      newMap.delete(file.name);
      return newMap;
    });
  };

  const handleModerationError = (file: File, error: string) => {
    alert(`Moderatie fout voor "${file.name}": ${error}`);
    setModeratingFiles(prev => {
      const newMap = new Map(prev);
      newMap.delete(file.name);
      return newMap;
    });
  };

  const removeAt = (idx: number) => {
    isInternalChange.current = true;
    const next = [...items];
    next.splice(idx, 1);
    setItems(next);
  };

  const getStatusIcon = (item: Uploaded) => {
    if (!item.isModerated) {
      return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
    if (item.isApproved) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusColor = (item: Uploaded) => {
    if (!item.isModerated) return 'border-gray-200';
    if (item.isApproved) return 'border-green-200';
    return 'border-red-200';
  };

  return (
    <div className="space-y-4">
      {/* Compact upload section */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center space-x-3">
          <label htmlFor="file-upload" className="cursor-pointer">
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Foto's toevoegen
            </button>
          </label>
          <span className="text-sm text-gray-600">
            {items.length}/{max} foto's
          </span>
        </div>
        <input
          id="file-upload"
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
          className="sr-only"
        />
      </div>

      {/* Approved images - compact and visible */}
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
                    onLoad={() => console.log('Image loaded successfully:', item.url.substring(0, 50))}
                  />
                </div>
                
                {/* Status indicator */}
                <div className="absolute top-1 left-1">
                  {getStatusIcon(item)}
                </div>
                
                {/* Remove button */}
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  onClick={() => removeAt(idx)}
                  aria-label="Verwijder foto"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files being moderated - compact */}
      {Array.from(moderatingFiles.values()).map((file, idx) => (
        <div key={`moderating-${idx}`} className="border border-blue-200 bg-blue-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-800">
              Moderatie: {file.name}
            </span>
          </div>
          <ImageModeration
            imageFile={file}
            category={category}
            productTitle={productTitle}
            onModerationComplete={(result) => handleModerationComplete(file, result)}
            onModerationError={(error) => handleModerationError(file, error)}
          />
        </div>
      ))}


      {/* Compact info box - only show when no photos */}
      {items.length === 0 && moderatingFiles.size === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-medium">AI Content Moderation</p>
              <p className="text-blue-700">
                Foto's worden automatisch gecontroleerd voordat ze worden opgeslagen.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
