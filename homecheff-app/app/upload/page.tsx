"use client";
import React, { useState, useEffect } from "react";

type UploadData = {
  files: { name: string; url: string }[];
};

export default function UploadPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UploadData>({ files: [] });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    setLoading(true);
    // Simuleer upload
    setTimeout(() => {
      setData((prev) => ({
        files: [
          ...prev.files,
          { name: selectedFile.name, url: URL.createObjectURL(selectedFile) },
        ],
      }));
      setSelectedFile(null);
      setLoading(false);
    }, 1000);
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <header className="w-full border-b" style={{ borderColor: "#e5e7eb", background: "#fff" }}>
        <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between">
          <span className="text-2xl font-bold" style={{ color: "var(--primary)" }}>Uploaden</span>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-8 grid gap-8">
        <div className="mb-4 text-sm text-gray-600 bg-yellow-50 border-l-4 p-3 rounded" style={{ borderColor: "var(--accent)" }}>
          Upload hier je productfoto's, ruimtefoto's of documenten. Je kunt meerdere bestanden toevoegen. Voor een optimale ervaring: gebruik duidelijke bestandsnamen.
        </div>
        <div className="rounded-xl bg-white p-6 border" style={{ borderColor: "#e5e7eb" }}>
          <input type="file" onChange={handleFileChange} className="mb-4" />
          <button className="px-4 py-2 rounded text-white" style={{ background: "var(--primary)" }} onClick={handleUpload} disabled={loading || !selectedFile}>
            {loading ? "Bezig met uploaden..." : "Uploaden"}
          </button>
          <ul className="mt-6 space-y-2">
            {data.files.map((file, idx) => (
              <li key={idx}>
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{file.name}</a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
