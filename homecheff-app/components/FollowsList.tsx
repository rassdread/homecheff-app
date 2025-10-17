"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ClickableName from '@/components/ui/ClickableName';
import SafeImage from '@/components/ui/SafeImage';
import { getDisplayName } from '@/lib/displayName';

type Follow = { id: string; Seller?: { id: string; name?: string | null; image?: string | null; profileImage?: string | null } };

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
        Nog geen fan (van). Zodra je iemands fan wordt, verschijnt het hier.
      </div>
    );
  }

  return (
    <ul className="rounded-xl border bg-white divide-y">
      {items.map(f => (
        <li key={f.id} className="p-3 flex items-center gap-3">
          <SafeImage
            src={f.Seller?.profileImage || f.Seller?.image || "/avatar-placeholder.png"}
            alt="Profielfoto"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover border"
          />
          <ClickableName 
            user={f.Seller}
            className="font-medium hover:text-primary-600 transition-colors"
            fallbackText="Verkoper"
            linkTo="profile"
          />
        </li>
      ))}
    </ul>
  );
}
