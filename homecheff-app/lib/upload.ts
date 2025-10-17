// lib/upload.ts - Uniforme upload service

export interface UploadResult {
  url: string;
  success: boolean;
  error?: string;
}

export async function uploadFile(file: File, endpoint: string = '/api/upload'): Promise<UploadResult> {
  try {
    // Client-side validation
    if (!file.type.startsWith('image/')) {
      return {
        url: '',
        success: false,
        error: 'Alleen afbeeldingen zijn toegestaan.'
      };
    }
    
    // Check for specific image formats
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return {
        url: '',
        success: false,
        error: 'Alleen JPG, PNG, WebP en GIF bestanden zijn toegestaan.'
      };
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB - consistent met andere uploads
      return {
        url: '',
        success: false,
        error: 'Bestand is te groot. Maximum 5MB toegestaan.'
      };
    }

    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        url: '',
        success: false,
        error: errorData.error || `Upload mislukt (${response.status})`
      };
    }
    
    const data = await response.json();
    
    if (data.url || data.publicUrl) {
      return {
        url: data.url || data.publicUrl,
        success: true
      };
    } else {
      return {
        url: '',
        success: false,
        error: 'Geen URL ontvangen van server'
      };
    }
  } catch (error) {
    console.error('Upload error:', error);
    return {
      url: '',
      success: false,
      error: error instanceof Error ? error.message : 'Onbekende upload fout'
    };
  }
}

export async function uploadProfilePhoto(file: File): Promise<UploadResult> {
  return uploadFile(file, '/api/profile/photo/upload');
}

export async function uploadProductImages(file: File): Promise<UploadResult> {
  return uploadFile(file, '/api/upload');
}

export async function uploadWorkspacePhoto(file: File): Promise<UploadResult> {
  return uploadFile(file, '/api/seller/upload-workplace-photos');
}

export async function uploadDeliveryProfilePhoto(file: File): Promise<UploadResult> {
  return uploadFile(file, '/api/delivery/upload-profile-photo');
}

export async function uploadVehiclePhotos(file: File): Promise<UploadResult> {
  return uploadFile(file, '/api/delivery/upload-vehicle-photos');
}
