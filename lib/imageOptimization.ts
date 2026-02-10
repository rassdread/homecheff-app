/**
 * Image Optimization Utilities
 * Compress and resize images before upload
 */

export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Could not compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Could not load image'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('Could not read file'));
    };
  });
}

export function getOptimizedImageUrl(
  url: string,
  width?: number,
  quality?: number
): string {
  // If it's a Vercel Blob URL, we can add query parameters for optimization
  if (url.includes('vercel-storage.com') || url.includes('public.blob.vercel-storage.com')) {
    const params = new URLSearchParams();
    if (width) params.append('w', width.toString());
    if (quality) params.append('q', quality.toString());
    
    return `${url}${params.toString() ? '?' + params.toString() : ''}`;
  }
  
  // For other URLs, return as-is
  return url;
}

export const IMAGE_SIZES = {
  thumbnail: { width: 200, quality: 60 },
  small: { width: 400, quality: 70 },
  medium: { width: 800, quality: 75 },
  large: { width: 1200, quality: 80 },
  full: { width: 1920, quality: 85 }
};

/**
 * Compress a data URL (base64 image) to reduce size for storage
 * This is critical for storing images in sessionStorage/localStorage which have size limits
 */
export async function compressDataUrl(
  dataUrl: string,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.7,
  maxSizeKB: number = 500 // Max 500KB to stay well under storage limits
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check if already small enough
    const sizeKB = (dataUrl.length * 3) / 4 / 1024; // Approximate size in KB
    if (sizeKB < maxSizeKB) {
      console.log(`Image already small enough (${sizeKB.toFixed(1)}KB), skipping compression`);
      resolve(dataUrl);
      return;
    }

    const img = new window.Image();
    img.src = dataUrl;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Try to compress to target size
      let currentQuality = quality;
      let attempts = 0;
      const maxAttempts = 5;
      
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Could not compress image'));
              return;
            }
            
            const blobSizeKB = blob.size / 1024;
            console.log(`Compressed image: ${blobSizeKB.toFixed(1)}KB (quality: ${(currentQuality * 100).toFixed(0)}%)`);
            
            // If still too large and we can reduce quality more, try again
            if (blobSizeKB > maxSizeKB && currentQuality > 0.3 && attempts < maxAttempts) {
              currentQuality = Math.max(0.3, currentQuality - 0.1);
              attempts++;
              console.log(`Image still too large, reducing quality to ${(currentQuality * 100).toFixed(0)}%`);
              tryCompress();
              return;
            }
            
            // Convert blob back to data URL
            const reader = new FileReader();
            reader.onload = (e) => {
              const compressedDataUrl = e.target?.result as string;
              const finalSizeKB = (compressedDataUrl.length * 3) / 4 / 1024;
              console.log(`Final compressed image size: ${finalSizeKB.toFixed(1)}KB`);
              resolve(compressedDataUrl);
            };
            reader.onerror = () => {
              reject(new Error('Could not read compressed image'));
            };
            reader.readAsDataURL(blob);
          },
          'image/jpeg',
          currentQuality
        );
      };
      
      tryCompress();
    };
    
    img.onerror = () => {
      reject(new Error('Could not load image from data URL'));
    };
  });
}

