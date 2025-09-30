"use client";

import { useEffect, useState } from "react";
import ClickableName from '@/components/ui/ClickableName';
import { getDisplayName } from '@/lib/displayName';

type Follow = { 
  id: string; 
  seller?: { 
    id: string; 
    name?: string | null; 
    username?: string | null;
    profileImage?: string | null;
    displayFullName?: boolean | null;
    displayNameOption?: string | null;
  } 
};

export default function FollowsList() {
  const [items, setItems] = useState<Follow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/profile/follows");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="rounded-xl border p-4 bg-white animate-pulse h-24" />;

  if (!items.length) {
    return (
      <div className="rounded-xl border p-4 bg-white text-sm text-muted-foreground">
        Nog niemand gevolgd. Zodra de follow-relatie in je database staat, verschijnt het hier.
      </div>
    );
  }

  return (
    <ul className="rounded-xl border bg-white divide-y">
      {items.map(f => (
        <li key={f.id} className="p-3 flex items-center gap-3">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full overflow-hidden border bg-gray-200 flex-shrink-0">
            {f.seller?.profileImage ? (
              <img 
                src={f.seller.profileImage} 
                alt={getDisplayName(f.seller)} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary-brand text-white text-sm font-bold">
                {getDisplayName(f.seller).charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          {/* Name with link */}
          <ClickableName
            user={f.seller}
            className="font-medium hover:text-primary-600 transition-colors"
            fallbackText="Verkoper"
            linkTo="profile"
          />
        </li>
      ))}
    </ul>
  );
}
