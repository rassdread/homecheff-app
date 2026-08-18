import { generateVideoThumbnail } from '@/lib/videoUtils';
import type { ListingVideoRef, Px4aExportVideoPending } from '@/lib/studio/px4a-export-attach';

const CHUNK_SIZE = 2 * 1024 * 1024;
const SMALL_UPLOAD_LIMIT = 3.5 * 1024 * 1024;

async function uploadViaApi(file: File, signal?: AbortSignal): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', 'video');
  formData.append('uploadContext', 'dish');
  const res = await fetch('/api/upload', { method: 'POST', body: formData, signal });
  if (!res.ok) throw new Error('upload');
  const data = (await res.json()) as { url?: string };
  if (!data.url) throw new Error('upload');
  return { url: data.url };
}

async function uploadChunked(file: File, signal?: AbortSignal): Promise<{ url: string }> {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const initResponse = await fetch('/api/upload/video-chunked/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type || 'video/mp4',
      fileSize: file.size,
      totalChunks,
      uploadContext: 'dish',
    }),
    signal,
  });
  if (!initResponse.ok) throw new Error('upload');
  const { uploadId } = (await initResponse.json()) as { uploadId?: string };
  if (!uploadId) throw new Error('upload');
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    const chunkFormData = new FormData();
    chunkFormData.append('chunk', chunk);
    chunkFormData.append('uploadId', uploadId);
    chunkFormData.append('chunkIndex', String(chunkIndex));
    chunkFormData.append('totalChunks', String(totalChunks));
    const chunkResponse = await fetch('/api/upload/video-chunked/chunk', {
      method: 'POST',
      body: chunkFormData,
      signal,
    });
    if (!chunkResponse.ok) throw new Error('upload');
  }
  const finalizeResponse = await fetch('/api/upload/video-chunked/finalize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uploadId }),
    signal,
  });
  if (!finalizeResponse.ok) throw new Error('upload');
  const data = (await finalizeResponse.json()) as { url?: string };
  if (!data.url) throw new Error('upload');
  return { url: data.url };
}

export async function uploadListingDishVideo(file: File, signal?: AbortSignal): Promise<{ url: string }> {
  if (file.size > SMALL_UPLOAD_LIMIT) return uploadChunked(file, signal);
  return uploadViaApi(file, signal);
}

export async function attachPx4aExportVideo(
  pending: Px4aExportVideoPending,
  signal?: AbortSignal,
): Promise<ListingVideoRef> {
  const res = await fetch(pending.url, { signal, credentials: 'omit' });
  if (!res.ok) throw new Error('fetch');
  const blob = await res.blob();
  if (blob.size <= 0) throw new Error('empty');
  const file = new File([blob], 'homecheff-video.mp4', {
    type: blob.type || 'video/mp4',
    lastModified: Date.now(),
  });
  const uploaded = await uploadListingDishVideo(file, signal);
  let thumbnail: string | null = pending.thumb;
  try {
    thumbnail = await generateVideoThumbnail(file, 1);
  } catch {
    thumbnail = pending.thumb;
  }
  return {
    url: uploaded.url,
    thumbnail,
    duration: pending.duration,
  };
}
