'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function SellerOnboardingPage() {
  const router = useRouter();
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [workplacePhotos, setWorkplacePhotos] = useState<string[]>([]);
  const [error, setError] = useState("");
  const userId = 'anon'; // TODO: vervang met echte sessie userId

  async function uploadFile(file: File): Promise<string | null> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url as string;
  }

  async function onPickProfile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      const url = await uploadFile(f);
      if (url) setProfileImage(url);
    }
  }

  async function onPickWorkplace(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    for (const f of files.slice(0, 3 - workplacePhotos.length)) {
      const url = await uploadFile(f);
      if (url) setWorkplacePhotos(prev => [...prev, url]);
    }
  }

  async function save() {
    setError("");
    if (workplacePhotos.length < 1) {
      setError("Upload minstens één foto van je werkplek.");
      return;
    }
    const res = await fetch("/api/profile/seller", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, bio, profileImage, workplacePhotos })
    });
    if (res.ok) router.push("/");
    else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Opslaan mislukt");
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

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Profielfoto</label>
              <input type="file" accept="image/*" onChange={onPickProfile} />
              {profileImage && <img src={profileImage} alt="profielfoto" className="mt-2 w-32 h-32 object-cover rounded-full border" />}
            </div>

            <div>
              <label className="block font-medium mb-1">Werkplek foto's (max 3, min 1)</label>
              <input type="file" multiple accept="image/*" onChange={onPickWorkplace} />
              <div className="flex gap-2 mt-2 flex-wrap">
                {workplacePhotos.map((url, i) => (
                  <img key={i} src={url} alt={"workplek" + i} className="w-32 h-20 object-cover rounded border" />
                ))}
              </div>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex justify-end">
            <Button onClick={save}>Opslaan en afronden</Button>
          </div>
        </div>
      </section>
    </main>
  );
}
