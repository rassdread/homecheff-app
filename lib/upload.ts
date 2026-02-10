// lib/upload.ts - Uniforme upload service

import { compressImage } from './imageOptimization';

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
    
    // Increased limit to 50MB because we compress images automatically
    // After compression, images should be much smaller
    // This allows users to upload high-quality photos from modern cameras
    // Most photos are under 25MB, so 50MB is a safe upper limit
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    
    if (file.size > MAX_FILE_SIZE) {
      return {
        url: '',
        success: false,
        error: 'Foto is te groot. Probeer een kleinere foto.'
      };
    }

    // CRITICAL: Compress image before upload to reduce file size and improve performance
    // This helps prevent storage quota errors and speeds up uploads
    // We compress all images larger than 500KB, and always compress very large images (>5MB)
    let fileToUpload: File | Blob = file;
    try {
      // Always compress if file is larger than 500KB, or if it's very large (>5MB) compress more aggressively
      if (file.size > 500 * 1024) {
        const isVeryLarge = file.size > 5 * 1024 * 1024;
        const maxWidth = isVeryLarge ? 1920 : 2560; // More aggressive compression for very large files
        const maxHeight = isVeryLarge ? 1080 : 1440;
        const quality = isVeryLarge ? 0.75 : 0.8; // Lower quality for very large files
        
        console.log(`Compressing image before upload: ${(file.size / 1024).toFixed(1)}KB`);
        const compressedBlob = await compressImage(file, maxWidth, maxHeight, quality);
        const compressedSizeKB = (compressedBlob.size / 1024).toFixed(1);
        const originalSizeKB = (file.size / 1024).toFixed(1);
        const compressionRatio = ((1 - compressedBlob.size / file.size) * 100).toFixed(1);
        console.log(`Image compressed: ${originalSizeKB}KB -> ${compressedSizeKB}KB (${compressionRatio}% reduction)`);
        
        // Verify compressed size is reasonable (should be under 2MB after compression)
        if (compressedBlob.size > 2 * 1024 * 1024) {
          console.warn(`Compressed image still large (${compressedSizeKB}KB), applying more aggressive compression...`);
          // Try more aggressive compression
          const moreCompressed = await compressImage(file, 1920, 1080, 0.7);
          if (moreCompressed.size < compressedBlob.size) {
            fileToUpload = new File([moreCompressed], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            console.log(`Re-compressed to: ${(moreCompressed.size / 1024).toFixed(1)}KB`);
          } else {
            // Use first compression result
            fileToUpload = new File([compressedBlob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
          }
        } else {
          // Convert blob to File to maintain filename
          fileToUpload = new File([compressedBlob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
        }
      }
    } catch (compressionError) {
      console.warn('Image compression failed, using original file:', compressionError);
      // If compression fails and file is still too large, reject it
      if (file.size > 10 * 1024 * 1024) {
        return {
          url: '',
          success: false,
          error: 'Foto is te groot en kon niet worden gecomprimeerd. Probeer een kleinere foto.'
        };
      }
      // Continue with original file if compression fails and file is reasonable size
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);
    
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
