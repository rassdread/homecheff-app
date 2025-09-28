// lib/server-image-compression.ts - Server-side image compression using Sharp

import sharp from 'sharp';

export interface ServerCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
  maxSizeKB?: number;
}

export interface ServerCompressionResult {
  buffer: Buffer;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
  format: string;
}

const DEFAULT_OPTIONS: Required<ServerCompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 85,
  format: 'jpeg',
  maxSizeKB: 500
};

/**
 * Compress image buffer using Sharp
 */
export async function compressImageBuffer(
  inputBuffer: Buffer,
  options: ServerCompressionOptions = {}
): Promise<ServerCompressionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    // Get original image metadata
    const originalMetadata = await sharp(inputBuffer).metadata();
    const originalSize = inputBuffer.length;
    
    // Calculate new dimensions maintaining aspect ratio
    const { width: newWidth, height: newHeight } = calculateDimensions(
      originalMetadata.width || 0,
      originalMetadata.height || 0,
      opts.maxWidth,
      opts.maxHeight
    );
    
    // Compress image
    let sharpInstance = sharp(inputBuffer)
      .resize(newWidth, newHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    
    // Apply format-specific compression
    switch (opts.format) {
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({
          quality: opts.quality,
          progressive: true,
          mozjpeg: true
        });
        break;
      
      case 'webp':
        sharpInstance = sharpInstance.webp({
          quality: opts.quality,
          effort: 6
        });
        break;
      
      case 'png':
        sharpInstance = sharpInstance.png({
          quality: opts.quality,
          compressionLevel: 9,
          progressive: true
        });
        break;
    }
    
    // Generate compressed buffer
    const compressedBuffer = await sharpInstance.toBuffer();
    const compressedSize = compressedBuffer.length;
    
    // If still too large, try with lower quality
    if (compressedSize > opts.maxSizeKB * 1024) {
      const lowerQuality = Math.max(10, opts.quality - 20);
      
      let retryInstance = sharp(inputBuffer)
        .resize(newWidth, newHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      
      switch (opts.format) {
        case 'jpeg':
          retryInstance = retryInstance.jpeg({
            quality: lowerQuality,
            progressive: true,
            mozjpeg: true
          });
          break;
        
        case 'webp':
          retryInstance = retryInstance.webp({
            quality: lowerQuality,
            effort: 6
          });
          break;
        
        case 'png':
          retryInstance = retryInstance.png({
            quality: lowerQuality,
            compressionLevel: 9,
            progressive: true
          });
          break;
      }
      
      const retryBuffer = await retryInstance.toBuffer();
      
      return {
        buffer: retryBuffer,
        originalSize,
        compressedSize: retryBuffer.length,
        compressionRatio: (originalSize - retryBuffer.length) / originalSize,
        width: newWidth,
        height: newHeight,
        format: opts.format
      };
    }
    
    return {
      buffer: compressedBuffer,
      originalSize,
      compressedSize,
      compressionRatio: (originalSize - compressedSize) / originalSize,
      width: newWidth,
      height: newHeight,
      format: opts.format
    };
    
  } catch (error) {
    console.error('Image compression failed:', error);
    throw new Error('Failed to compress image');
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
 * Get compression preset for different use cases
 */
export function getServerCompressionPreset(type: 'profile' | 'product' | 'recipe' | 'workspace'): ServerCompressionOptions {
  switch (type) {
    case 'profile':
      return {
        maxWidth: 800,
        maxHeight: 800,
        quality: 90,
        format: 'jpeg',
        maxSizeKB: 200
      };
    
    case 'product':
      return {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 85,
        format: 'jpeg',
        maxSizeKB: 500
      };
    
    case 'recipe':
      return {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 80,
        format: 'jpeg',
        maxSizeKB: 400
      };
    
    case 'workspace':
      return {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 80,
        format: 'jpeg',
        maxSizeKB: 300
      };
    
    default:
      return DEFAULT_OPTIONS;
  }
}

/**
 * Detect image type from buffer
 */
export async function detectImageType(buffer: Buffer): Promise<string> {
  try {
    const metadata = await sharp(buffer).metadata();
    return metadata.format || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Get image metadata
 */
export async function getImageMetadata(buffer: Buffer) {
  try {
    return await sharp(buffer).metadata();
  } catch (error) {
    console.error('Failed to get image metadata:', error);
    return null;
  }
}
