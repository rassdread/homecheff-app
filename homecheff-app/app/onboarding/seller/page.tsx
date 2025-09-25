'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import WorkspacePhotoUpload from "@/components/workspace/WorkspacePhotoUpload";
import { uploadProfilePhoto } from "@/lib/upload";

export default function SellerOnboardingPage() {
  const router = useRouter();
  const [bio, setBio] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [workplacePhotos, setWorkplacePhotos] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const userId = 'anon'; // TODO: vervang met echte sessie userId

  async function onPickProfile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const result = await uploadProfilePhoto(file);
      if (result.success) {
        setImage(result.url);
      } else {
        setError(`Profielfoto upload mislukt: ${result.error}`);
      }
    } catch (error) {
      setError(`Profielfoto upload mislukt: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setError("");
    if (workplacePhotos.length < 1) {
      setError("Upload minstens één foto van je werkplek.");
      return;
    }
    
    setUploading(true);
    try {
      const res = await fetch("/api/profile/seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, bio, image, workplacePhotos })
      });
      
      if (res.ok) {
        router.push("/");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Opslaan mislukt");
      }
    } catch (error) {
      setError("Er is een fout opgetreden bij het opslaan");
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen p-4 max-w-4xl mx-auto space-y-6">
      <section className="bg-white rounded-2xl p-6 shadow">
        <h1 className="text-2xl font-bold mb-4">Verkoper Profiel</h1>
        <div className="grid gap-4">
          <div>
            <label className="block font-medium mb-1">Bio</label>
            <textarea
              className="w-full border rounded p-2"
              rows={5}
              placeholder="Vertel iets over jezelf en je werkplek."
              value={bio}
              onChange={e => setBio(e.target.value)}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block font-medium mb-2">Profielfoto</label>
              <div className="flex flex-col items-center space-y-3">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={onPickProfile}
                  className="hidden"
                  id="profile-photo"
                  disabled={uploading}
                />
                <label 
                  htmlFor="profile-photo"
                  className={`cursor-pointer px-4 py-2 rounded-lg border-2 border-dashed transition-colors ${
                    uploading 
                      ? 'border-gray-300 bg-gray-100 cursor-not-allowed' 
                      : 'border-primary-300 hover:border-primary-400 hover:bg-primary-50'
                  }`}
                >
                  {uploading ? 'Uploaden...' : 'Kies profielfoto'}
                </label>
                {image && (
                  <img 
                    src={image} 
                    alt="Profielfoto" 
                    className="w-32 h-32 object-cover rounded-full border-2 border-primary-200" 
                  />
                )}
              </div>
            </div>

            <div>
              <WorkspacePhotoUpload
                maxPhotos={10}
                initialPhotos={workplacePhotos}
                onPhotosChange={setWorkplacePhotos}
                userType="SELLER"
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex justify-end">
            <Button 
              onClick={save}
              disabled={uploading}
              className={uploading ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {uploading ? 'Opslaan...' : 'Opslaan en afronden'}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
