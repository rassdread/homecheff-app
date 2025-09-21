
'use client';
import * as React from 'react';
import ImageModeration from '../moderation/ImageModeration';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

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

export default function MultiImageUploader({ max = 5, value = [], onChange, category = 'CHEFF', productTitle }: Props) {
  const [items, setItems] = React.useState<Uploaded[]>(value);
  const [moderatingFiles, setModeratingFiles] = React.useState<Map<string, File>>(new Map());

  React.useEffect(() => {
    onChange?.(items);
  }, [items]);

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
      setModeratingFiles(prev => new Map(prev).set(file.name, file));
    }
  };

  const handleModerationComplete = async (file: File, result: any) => {
    // Upload file only after successful moderation
    if (result.isAppropriate && result.isValidForCategory) {
      const fd = new FormData();
      fd.append('file', file);
      
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const errorMessage = errorData.error || 'Upload mislukt';
          alert(`Upload van "${file.name}" mislukt: ${errorMessage}`);
          return;
        }
        const data = await res.json();
        if (data?.url) {
          const newItem: Uploaded = {
            url: data.url,
            moderationResult: result,
            isModerated: true,
            isApproved: true
          };
          setItems(prev => [...prev, newItem]);
        } else {
          alert(`Upload van "${file.name}" mislukt: Geen URL ontvangen`);
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
    <div className="hc-tight space-y-4">
      <div className="flex items-center gap-3">
        <label className="hc-label">Foto's (max {max})</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <span className="text-sm text-gray-500">
          {items.length}/{max} geüpload
        </span>
      </div>

      {/* Files being moderated */}
      {Array.from(moderatingFiles.values()).map((file, idx) => (
        <div key={`moderating-${idx}`} className="border-2 border-dashed border-blue-200 bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <span className="text-sm font-medium text-blue-800">
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

      {/* Approved images */}
      {items.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Goedgekeurde foto's:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((item, idx) => (
              <div key={idx} className={`relative border-2 rounded-lg overflow-hidden ${getStatusColor(item)}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={item.url} 
                  alt={`upload-${idx}`} 
                  className="w-full h-24 object-cover" 
                />
                <div className="absolute top-2 left-2">
                  {getStatusIcon(item)}
                </div>
                <button
                  type="button"
                  className="absolute top-2 right-2 rounded-md px-2 py-1 text-xs bg-white/90 hover:bg-white text-red-600 font-medium"
                  onClick={() => removeAt(idx)}
                  aria-label="Verwijder foto"
                >
                  ×
                </button>
                {item.moderationResult && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2">
                    <div className="flex items-center justify-between">
                      <span>
                        {Math.round(item.moderationResult.confidence * 100)}% vertrouwen
                      </span>
                      {item.moderationResult.detectedObjects?.slice(0, 2).map((obj: string, i: number) => (
                        <span key={i} className="bg-blue-500/80 px-1 rounded text-xs">
                          {obj}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">AI Content Moderation</p>
            <p className="text-blue-700">
              Alle foto's worden automatisch gecontroleerd op ongepaste inhoud en categorie-overeenkomst. 
              Alleen geschikte foto's worden geüpload naar de feed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
