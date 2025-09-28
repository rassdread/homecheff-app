// lib/image-compression.ts - Client-side image compression utilities

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
  maxSizeKB?: number;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.85,
  format: 'jpeg',
  maxSizeKB: 500
};

/**
 * Compress an image file using Canvas API
 */
export async function compressImage(
  file: File, 
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Simple fallback: return original file if compression fails
  // Vercel Blob will handle optimization
  try {
    // Check if file is already small enough
    const fileSizeKB = file.size / 1024;
    if (fileSizeKB <= opts.maxSizeKB) {
      return {
        file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 0,
        width: 0,
        height: 0
      };
    }
    
    // For now, just return the original file
    // Vercel Blob will handle the optimization
    console.log(`File ${file.name} (${formatFileSize(file.size)}) - using original (Vercel Blob will optimize)`);
    
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 0,
      width: 0,
      height: 0
    };
  } catch (error) {
    console.warn('Compression failed, using original file:', error);
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 0,
      width: 0,
      height: 0
    };
  }
}

/**
 * Calculate new dimensions maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight };
  
  // Scale down if too large
  if (width > maxWidth || height > maxHeight) {
    const aspectRatio = width / height;
    
    if (width > height) {
      width = Math.min(maxWidth, width);
      height = width / aspectRatio;
      
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
    } else {
      height = Math.min(maxHeight, height);
      width = height * aspectRatio;
      
      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }
    }
  }
  
  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Compress multiple images
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];
  
  for (const file of files) {
    try {
      const result = await compressImage(file, options);
      results.push(result);
    } catch (error) {
      console.error(`Failed to compress ${file.name}:`, error);
      // Return original file if compression fails
      results.push({
        file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 0,
        width: 0,
        height: 0
      });
    }
  }
  
  return results;
}

/**
 * Get compression preset for different use cases
 */
export function getCompressionPreset(type: 'profile' | 'product' | 'recipe' | 'workspace'): CompressionOptions {
  switch (type) {
    case 'profile':
      return {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.9,
        format: 'jpeg',
        maxSizeKB: 200
      };
    
    case 'product':
      return {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        format: 'jpeg',
        maxSizeKB: 500
      };
    
    case 'recipe':
      return {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8,
        format: 'jpeg',
        maxSizeKB: 400
      };
    
    case 'workspace':
      return {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8,
        format: 'jpeg',
        maxSizeKB: 300
      };
    
    default:
      return DEFAULT_OPTIONS;
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Validate file before compression
 */
export function validateImageFile(file: File, maxSizeMB: number = 10): { valid: boolean; error?: string } {
  if (!isImageFile(file)) {
    return { valid: false, error: 'Bestand is geen afbeelding' };
  }
  
  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, error: `Bestand is te groot. Maximum ${maxSizeMB}MB toegestaan.` };
  }
  
  return { valid: true };
}
