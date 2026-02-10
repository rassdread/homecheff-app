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

