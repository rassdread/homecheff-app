import { put } from '@vercel/blob';
import { NextRequest } from 'next/server';

export async function uploadFile(file: File, filename?: string): Promise<string> {
  try {
    const blob = await put(filename || file.name, file, {
      access: 'public',
    });
    return blob.url;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('Failed to upload file');
  }
}

export async function uploadMultipleFiles(files: File[]): Promise<string[]> {
  try {
    const uploadPromises = files.map(file => uploadFile(file));
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error('Multiple upload error:', error);
    throw new Error('Failed to upload files');
  }
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

export function validateFileSize(file: File, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = getFileExtension(originalName);
  return `${timestamp}-${randomString}.${extension}`;
}

