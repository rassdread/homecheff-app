'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

const ALL_TAGS = ["Italiaans", "Vegetarisch", "Glutenvrij", "Halal", "Zoet", "Pittig"];

export default function BuyerOnboardingPage() {
  const router = useRouter();
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const userId = 'anon'; // TODO: vervang met echte sessie userId

  function toggle(tag: string) {
    setInterests(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  async function save() {
    const res = await fetch("/api/profile/buyer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, bio, interests })
    });
    if (res.ok) router.push("/");
  }

  return (
    <main className="min-h-screen p-4 max-w-4xl mx-auto space-y-6">
      <section className="bg-white rounded-2xl p-6 shadow">
        <h1 className="text-2xl font-bold mb-4">Mijn Profiel</h1>
        <div className="grid gap-4">
          <div>
            <label className="block font-medium mb-1">Bio</label>
            <textarea
              className="w-full border rounded p-2"
              rows={5}
              placeholder="Vertel kort iets over jezelf en waarom je op HomeCheff bent."
              value={bio}
              onChange={e => setBio(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Voorkeuren / interesses</label>
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggle(tag)}
                  className={`px-3 py-1 rounded-full text-sm border ${interests.includes(tag) ? 'bg-emerald-100 border-emerald-400 text-emerald-800' : 'bg-gray-100 border-gray-300 text-gray-700'}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={save}>Opslaan en verder</Button>
          </div>
        </div>
      </section>
    </main>
  );
}

// Include seller information in the profile query
// seller: { select: { id: true, name: true, profileImage: true, role: true } }
