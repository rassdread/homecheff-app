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
  
  useEffect(() => {
    // Store photo in sessionStorage for the forms to pick up
    if (initialPhoto) {
      sessionStorage.setItem('inspiratiePhoto', initialPhoto);
      sessionStorage.setItem('inspiratieLocation', location);
    }
  }, [initialPhoto, location]);

  // Render the appropriate form based on location
  if (location === 'keuken') {
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
        <div className="min-h-screen">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">🍳 Keuken Inspiratie</h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <RecipeManager isActive={true} />
        </div>
      </div>
    );
  }

  if (location === 'tuin') {
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
        <div className="min-h-screen">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">🌱 Tuin Inspiratie</h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <GardenManager isActive={true} />
        </div>
      </div>
    );
  }

  if (location === 'atelier') {
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
        <div className="min-h-screen">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">🎨 Atelier Inspiratie</h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <DesignManager isActive={true} />
        </div>
      </div>
    );
  }

  return null;
}



