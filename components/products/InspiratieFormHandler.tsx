'use client';

import { useState, useEffect } from 'react';
import RecipeManager from '@/components/profile/RecipeManager';
import GardenManager from '@/components/profile/GardenManager';
import DesignManager from '@/components/designs/DesignManager';

interface InspiratieFormHandlerProps {
  location: string;
  initialPhoto?: string;
  onSave: () => void;
  onCancel: () => void;
}

export default function InspiratieFormHandler({ 
  location, 
  initialPhoto, 
  onSave, 
  onCancel 
}: InspiratieFormHandlerProps) {
  
  // Render the appropriate form based on location
  // Support both old location names (keuken/tuin/atelier) and new inspiratie names (recepten/kweken/designs)
  const normalizedLocation = 
    location === 'recepten' ? 'keuken' :
    location === 'kweken' ? 'tuin' :
    location === 'designs' ? 'atelier' :
    location;

  useEffect(() => {
    // Store photo in sessionStorage for the forms to pick up
    // Use normalized location so managers can properly match it
    if (initialPhoto) {
      sessionStorage.setItem('inspiratiePhoto', initialPhoto);
      sessionStorage.setItem('inspiratieLocation', normalizedLocation);
    }
    // Force open form by setting a flag that managers can check
    sessionStorage.setItem('forceOpenForm', 'true');
    
    // Cleanup on unmount
    return () => {
      sessionStorage.removeItem('forceOpenForm');
    };
  }, [initialPhoto, normalizedLocation]);

  if (normalizedLocation === 'keuken') {
    return (
      <div className="min-h-full">
        <RecipeManager isActive={true} autoOpenForm={true} />
      </div>
    );
  }

  if (normalizedLocation === 'tuin') {
    return (
      <div className="min-h-full">
        <GardenManager isActive={true} autoOpenForm={true} />
      </div>
    );
  }

  if (normalizedLocation === 'atelier') {
    return (
      <div className="min-h-full">
        <DesignManager isActive={true} autoOpenForm={true} />
      </div>
    );
  }

  return null;
}





