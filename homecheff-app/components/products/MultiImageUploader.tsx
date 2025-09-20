
'use client';
import * as React from 'react';

type Uploaded = { url: string };

type Props = {
  max?: number;
  value?: Uploaded[];
  onChange?: (files: Uploaded[]) => void;
};

export default function MultiImageUploader({ max = 5, value = [], onChange }: Props) {
  const [items, setItems] = React.useState<Uploaded[]>(value);

  React.useEffect(() => {
    onChange?.(items);
  }, [items]);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const current = [...items];
    for (let i = 0; i < files.length; i++) {
      if (current.length >= max) break;
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
      
      const fd = new FormData();
      fd.append('file', file);
      
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const errorMessage = errorData.error || 'Upload mislukt';
          alert(`Upload van "${file.name}" mislukt: ${errorMessage}`);
          console.error('Upload failed:', errorData);
          continue;
        }
        const data = await res.json();
        if (data?.url) {
          current.push({ url: data.url });
        } else {
          alert(`Upload van "${file.name}" mislukt: Geen URL ontvangen`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert(`Upload van "${file.name}" mislukt: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
      }
    }
    setItems(current);
  };

  const removeAt = (idx: number) => {
    const next = [...items];
    next.splice(idx, 1);
    setItems(next);
  };

  return (
    <div className="hc-tight">
      <div className="flex items-center gap-3">
        <label className="hc-label">Foto's (max {max})</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {items.length > 0 && (
        <div className="hc-grid-photos">
          {items.map((it, idx) => (
            <div key={idx} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.url} alt={`upload-${idx}`} className="w-full h-24 object-cover rounded-md" />
              <button
                type="button"
                className="absolute top-1 right-1 rounded-md px-2 py-1 text-xs bg-white/80 hover:bg-white"
                onClick={() => removeAt(idx)}
                aria-label="Verwijder foto"
              >
                Verwijder
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
