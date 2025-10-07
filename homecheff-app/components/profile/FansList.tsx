"use client";

import { useEffect, useState } from "react";
import ClickableName from '@/components/ui/ClickableName';
import { getDisplayName } from '@/lib/displayName';

type Fan = { 
  id: string; 
  user?: { 
    id: string; 
    name?: string | null; 
    username?: string | null;
    image?: string | null;
    profileImage?: string | null;
    displayFullName?: boolean | null;
    displayNameOption?: string | null;
  } 
};

interface FansListProps {
  userId?: string;
}

export default function FansList({ userId }: FansListProps) {
  const [items, setItems] = useState<Fan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const url = userId ? `/api/follows/fans?userId=${userId}` : "/api/follows/fans";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setItems(data.fans || []);
      }
      setLoading(false);
    })();
  }, [userId]);

  if (loading) return <div className="rounded-xl border p-4 bg-white animate-pulse h-24" />;

  if (!items.length) {
    return (
      <div className="rounded-xl border p-4 bg-white text-sm text-muted-foreground">
        Nog geen fans. Zodra mensen jouw fan worden, verschijnen ze hier.
      </div>
    );
  }

  return (
    <ul className="rounded-xl border bg-white divide-y">
      {items.map(fan => (
        <li key={fan.id} className="p-3 flex items-center gap-3">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full overflow-hidden border bg-gray-200 flex-shrink-0">
            {(fan.user?.profileImage || fan.user?.image) ? (
              <img 
                src={fan.user.profileImage || fan.user.image || ""} 
                alt={getDisplayName(fan.user)} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary-brand text-white text-sm font-bold">
                {getDisplayName(fan.user).charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          {/* Name with link */}
          <ClickableName
            user={fan.user}
            className="font-medium hover:text-primary-600 transition-colors"
            fallbackText="Fan"
            linkTo="profile"
          />
        </li>
      ))}
    </ul>
  );
}
