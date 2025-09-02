// components/profile/PhotoUploader.tsx — CLIENT component
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function PhotoUploader({ buttonLabel = "Foto kiezen" }: { buttonLabel?: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onPick() {
    fileRef.current?.click();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const presign = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, type: file.type || "image/jpeg" }),
      });
      if (!presign.ok) throw new Error("Kon upload-URL niet krijgen");
      const { url, publicUrl } = await presign.json();
      const put = await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "image/jpeg" },
      });
      if (!put.ok) throw new Error("Upload mislukt");
      const save = await fetch("/api/profile/photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: publicUrl }),
      });
      if (!save.ok) throw new Error("Opslaan mislukt");
      await save.json();
      router.refresh();
    } catch (e: any) {
      setError(e.message || "Er ging iets mis");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />
      <button
        type="button"
        onClick={onPick}
        disabled={busy}
        className="rounded-full bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {busy ? "Bezig…" : buttonLabel}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      <p className="text-[11px] text-gray-500">Tip: na upload wordt je avatar direct ververst.</p>
    </div>
  );
}
