"use client";

import { useEffect, useState } from "react";
import ClickableName from '@/components/ui/ClickableName';
import { getDisplayName } from '@/lib/displayName';
import { Heart, Users } from 'lucide-react';

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

interface PublicFollowsListProps {
  userId: string;
}

export default function PublicFollowsList({ userId }: PublicFollowsListProps) {
  const [items, setItems] = useState<Follow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/profile/follows?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
        } else {
          setError('Kon fan-lijst niet laden');
        }
      } catch (err) {
        console.error('Error loading follows:', err);
        setError('Kon fan-lijst niet laden');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p>Fan-lijst laden...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <Heart className="w-12 h-12 mx-auto mb-4 text-red-300" />
        <p>{error}</p>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Deze gebruiker volgt nog niemand</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        {items.length} {items.length === 1 ? 'persoon' : 'personen'} gevolgd
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(f => (
          <div key={f.id} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex-shrink-0">
              {f.seller?.profileImage ? (
                <img 
                  src={f.seller.profileImage} 
                  alt={getDisplayName(f.seller)} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary-brand text-white text-lg font-bold">
                  {getDisplayName(f.seller).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            {/* Name with link */}
            <div className="flex-1 min-w-0">
              <ClickableName
                user={f.seller}
                className="font-medium text-gray-900 hover:text-primary-600 transition-colors truncate"
                fallbackText="Gebruiker"
                linkTo="profile"
              />
              <div className="text-sm text-gray-500 truncate">
                @{f.seller?.username || 'gebruiker'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
