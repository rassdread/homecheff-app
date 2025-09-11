// components/profile/PhotoUploader.tsx — CLIENT component
"use client";

import { useState } from "react";
import Image from "next/image";

export default function PhotoUploader({ initialUrl }: { initialUrl?: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(initialUrl ?? null);
  const src = preview ?? url ?? "/avatar-placeholder.png";

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Instant preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload file to server
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/profile/photo/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      if (data.url) {
        setUrl(data.url);
        setPreview(null); // Clear preview since we now have the actual URL
      }
    } catch (error) {
      console.error('Upload error:', error);
      // Keep preview for user to see what they selected, but show error
      alert('Foto upload mislukt. Probeer het opnieuw.');
    }
  }

  return (
    <div className="group relative flex flex-col items-center gap-3">
      <div className="relative rounded-full overflow-hidden border-2 border-emerald-700/60 shadow-sm"
           style={{ width: "200px", height: "200px" }}>
        <Image src={src} alt="Profielfoto" fill className="object-cover" sizes="200px" />
        <label
          className="absolute inset-0 grid place-items-center text-emerald-800 font-medium cursor-pointer transition-opacity opacity-0 group-hover:opacity-100 whitespace-nowrap"
          style={{ background: "rgba(255,255,255,0.35)" }}
        >
          Foto wijzigen
          <input className="hidden" type="file" accept="image/*" onChange={onFileChange} />
        </label>
      </div>
    </div>
  );
}
