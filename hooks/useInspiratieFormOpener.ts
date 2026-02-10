import { useEffect, useRef } from 'react';

interface UseInspiratieFormOpenerOptions {
  isActive: boolean;
  expectedLocation: 'keuken' | 'tuin' | 'atelier';
  componentName: string;
  setShowForm: (show: boolean) => void;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

/**
 * Custom hook to handle opening inspiratie forms with photos from sessionStorage
 * Consolidates duplicate logic from RecipeManager, GardenManager, and DesignManager
 */
export function useInspiratieFormOpener({
  isActive,
  expectedLocation,
  componentName,
  setShowForm,
  setFormData
}: UseInspiratieFormOpenerOptions) {
  const hasLoadedPhoto = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (hasLoadedPhoto.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const openForm = urlParams.get('openForm') === 'true';
    const urlTab = urlParams.get('tab');
    const forceOpenForm = sessionStorage.getItem('forceOpenForm') === 'true';
    
    // Determine if this is the right tab based on expectedLocation
    const isCorrectTab = 
      (urlTab === 'dishes-chef' && expectedLocation === 'keuken') ||
      (urlTab === 'dishes-garden' && expectedLocation === 'tuin') ||
      (urlTab === 'dishes-designer' && expectedLocation === 'atelier');
    
    // Check if we should open form: either via URL params OR via forceOpenForm flag
    // When forceOpenForm is set, we're being called from InspiratieFormHandler
    const shouldOpenForm = forceOpenForm || (openForm && isCorrectTab);
    
    if (!shouldOpenForm) {
      return;
    }

    // Try to get photo from sessionStorage (check both keys)
    const inspiratiePhotoFromStorage = sessionStorage.getItem('inspiratiePhoto');
    const quickAddPhotoFromStorage = sessionStorage.getItem('quickAddPhoto');
    let inspiratiePhoto = inspiratiePhotoFromStorage || quickAddPhotoFromStorage;

    console.log(`=== ${componentName}: Opening form directly ===`);
    console.log('urlTab:', urlTab);
    console.log('expectedLocation:', expectedLocation);
    console.log('isActive:', isActive);
    console.log('inspiratiePhoto in storage:', inspiratiePhotoFromStorage ? `Yes (${inspiratiePhotoFromStorage.substring(0, 50)}...)` : 'No');
    console.log('quickAddPhoto in storage:', quickAddPhotoFromStorage ? `Yes (${quickAddPhotoFromStorage.substring(0, 50)}...)` : 'No');
    console.log('Photo found:', inspiratiePhoto ? `Yes (${inspiratiePhoto.substring(0, 50)}...)` : 'No');
    console.log('Photo is data URL:', inspiratiePhoto?.startsWith('data:') || false);
    console.log('Photo is blob URL:', inspiratiePhoto?.startsWith('blob:') || false);
    
    // Debug: log all sessionStorage keys
    console.log('All sessionStorage keys:', Object.keys(sessionStorage));

    // Open form immediately - don't wait for isActive, open as soon as component mounts
    // The form modal will cover the tab content anyway
    const openFormDirectly = () => {
      if (hasLoadedPhoto.current) return;
      hasLoadedPhoto.current = true;

      // When forceOpenForm is set, ALWAYS open form immediately (even without photo)
      if (forceOpenForm) {
        console.log(`=== ${componentName}: Opening form directly (forceOpenForm=true) ===`);
        
        // Add photo to formData if available
        if (inspiratiePhoto) {
          console.log(`=== ${componentName}: Adding photo to formData ===`);
          console.log('Photo length:', inspiratiePhoto.length);
          console.log('Photo starts with data:', inspiratiePhoto?.startsWith('data:'));
          
          // Create photo object with correct structure (NO stepNumber for main photos)
          const newPhoto = {
            id: `temp-${Date.now()}`,
            url: inspiratiePhoto,
            isMain: true
          };
          
          console.log('Photo object:', newPhoto);
          
          // Add photo to formData immediately
          setFormData((prev: any) => {
            console.log('Previous formData:', prev);
            console.log('Previous photos:', prev.photos);
            
            // Keep existing step photos separate
            const existingStepPhotos = (prev.photos || []).filter((p: any) => p.stepNumber !== undefined);
            const existingMainPhotos = (prev.photos || []).filter((p: any) => !p.stepNumber);
            
            // Check if photo already exists
            const photoExists = existingMainPhotos.some((p: any) => p.url === inspiratiePhoto);
            if (photoExists) {
              console.log('Photo already exists, skipping');
              return prev;
            }
            
            const updated = {
              ...prev,
              photos: [newPhoto, ...existingMainPhotos, ...existingStepPhotos]
            };
            
            console.log('Updated formData:', updated);
            console.log('Updated photos:', updated.photos);
            console.log('Main photos (no stepNumber):', updated.photos.filter((p: any) => !p.stepNumber));
            
            return updated;
          });
        }
        
        // Open form immediately (no delay needed when forceOpenForm is set)
        setShowForm(true);
        console.log(`Form opened directly`);
        return;
      }

      // Original logic for URL-based opening (with photo)
      if (inspiratiePhoto) {
        console.log(`=== ${componentName}: Adding photo to formData ===`);
        console.log('Photo length:', inspiratiePhoto.length);
        console.log('Photo starts with data:', inspiratiePhoto?.startsWith('data:'));
        
        // Create photo object with correct structure (NO stepNumber for main photos)
        const newPhoto = {
          id: `temp-${Date.now()}`,
          url: inspiratiePhoto,
          isMain: true
        };
        
        console.log('Photo object:', newPhoto);
        
        // Add photo to formData immediately
        setFormData((prev: any) => {
          console.log('Previous formData:', prev);
          console.log('Previous photos:', prev.photos);
          
          // Keep existing step photos separate
          const existingStepPhotos = (prev.photos || []).filter((p: any) => p.stepNumber !== undefined);
          const existingMainPhotos = (prev.photos || []).filter((p: any) => !p.stepNumber);
          
          // Check if photo already exists
          const photoExists = existingMainPhotos.some((p: any) => p.url === inspiratiePhoto);
          if (photoExists) {
            console.log('Photo already exists, skipping');
            return prev;
          }
          
          const updated = {
            ...prev,
            photos: [newPhoto, ...existingMainPhotos, ...existingStepPhotos]
          };
          
          console.log('Updated formData:', updated);
          console.log('Updated photos:', updated.photos);
          console.log('Main photos (no stepNumber):', updated.photos.filter((p: any) => !p.stepNumber));
          
          return updated;
        });
        
        // Open form after a very short delay to ensure state is set
        setTimeout(() => {
          setShowForm(true);
          console.log(`Form opened with photo`);
        }, 50);
      } else {
        console.warn(`No photo found, opening form without photo`);
        setShowForm(true);
      }

      // Clean up forceOpenForm flag if it was set
      if (forceOpenForm) {
        sessionStorage.removeItem('forceOpenForm');
      }
      
      // DON'T clean up sessionStorage immediately - let RecipeManager useEffect handle it
      // This ensures photo is available when form opens
      // Only clean up URL parameters
      setTimeout(() => {
        // Remove parameters from URL (but keep photo in sessionStorage until form confirms it's loaded)
        urlParams.delete('addInspiratie');
        urlParams.delete('openForm');
        const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
        window.history.replaceState({}, '', newUrl);
        console.log('URL cleaned (photo still in sessionStorage)');
      }, 1000);
    };

    // Open immediately when component mounts (form modal covers tab content)
    // When forceOpenForm is set, open immediately without delay
    if (forceOpenForm) {
      openFormDirectly();
      return;
    } else {
      const timer = setTimeout(openFormDirectly, 50);
      return () => clearTimeout(timer);
    }
  }, [isActive, expectedLocation, componentName, setShowForm, setFormData]);
}

