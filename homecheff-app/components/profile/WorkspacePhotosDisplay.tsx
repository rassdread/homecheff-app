'use client';

import { useState, useEffect } from 'react';
import { Grid, Camera, ChefHat, Sprout, Palette } from 'lucide-react';
import Image from 'next/image';

interface WorkspacePhoto {
  id: string;
  url: string;
  sortOrder: number;
}

interface WorkspacePhotosDisplayProps {
  userId: string;
  userRoles: string[];
  className?: string;
}

const ROLE_ICONS = {
  'CHEFF': ChefHat,
  'GROWN': Sprout,
  'DESIGNER': Palette,
  'SELLER': Grid
};

const ROLE_LABELS = {
  'CHEFF': 'De Keuken',
  'GROWN': 'De Tuin', 
  'DESIGNER': 'Het Atelier',
  'SELLER': 'Werkruimte'
};

const ROLE_DESCRIPTIONS = {
  'CHEFF': 'Waar de magie van koken gebeurt',
  'GROWN': 'Waar groenten en kruiden groeien',
  'DESIGNER': 'Waar creativiteit tot leven komt',
  'SELLER': 'Waar producten worden gemaakt'
};

export default function WorkspacePhotosDisplay({ 
  userId, 
  userRoles, 
  className = '' 
}: WorkspacePhotosDisplayProps) {
  const [photos, setPhotos] = useState<Record<string, WorkspacePhoto[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkspacePhotos();
  }, [userId]);

  const loadWorkspacePhotos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/profile/workspace-photos?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load workspace photos');
      }
      
      const data = await response.json();
      setPhotos(data.photos || {});
    } catch (err) {
      console.error('Error loading workspace photos:', err);
      setError('Kon werkruimte foto\'s niet laden');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center gap-3">
          <Grid className="w-6 h-6 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Werkruimte</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center gap-3">
          <Grid className="w-6 h-6 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Werkruimte</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Camera className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const hasPhotos = Object.values(photos).some(rolePhotos => rolePhotos.length > 0);

  if (!hasPhotos) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center gap-3">
          <Grid className="w-6 h-6 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Werkruimte</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Camera className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Nog geen werkruimte foto's gedeeld</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-3">
        <Grid className="w-6 h-6 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900">Werkruimte</h3>
      </div>

      {userRoles.map(role => {
        const rolePhotos = photos[role] || [];
        if (rolePhotos.length === 0) return null;

        const IconComponent = ROLE_ICONS[role as keyof typeof ROLE_ICONS] || Grid;
        const label = ROLE_LABELS[role as keyof typeof ROLE_LABELS] || 'Werkruimte';
        const description = ROLE_DESCRIPTIONS[role as keyof typeof ROLE_DESCRIPTIONS] || 'Waar producten worden gemaakt';

        return (
          <div key={role} className="space-y-4">
            <div className="flex items-center gap-3">
              <IconComponent className="w-5 h-5 text-primary-600" />
              <div>
                <h4 className="font-medium text-gray-900">{label}</h4>
                <p className="text-sm text-gray-500">{description}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {rolePhotos.map((photo) => (
                <div key={photo.id} className="group relative">
                  <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                    <Image
                      src={photo.url}
                      alt={`${label} foto`}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
