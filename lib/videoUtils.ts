/**
 * Video Utilities
 * Handle video validation, compression, and thumbnail generation
 */

/**
 * Get video URL with CORS proxy if needed
 * Fixes CORS errors when loading videos from Vercel Blob Storage
 * 
 * @param videoUrl Original video URL
 * @returns Video URL (proxied if from Vercel Blob Storage)
 */
export function getVideoUrlWithCors(videoUrl: string): string {
  // Check if it's a Vercel Blob Storage URL
  if (videoUrl && videoUrl.includes('public.blob.vercel-storage.com')) {
    // Use proxy to fix CORS issues
    const encodedUrl = encodeURIComponent(videoUrl);
    return `/api/video-proxy?url=${encodedUrl}`;
  }
  
  // For other URLs, return as-is
  return videoUrl;
}

/**
 * Video Utilities
 * Handle video validation, compression, and thumbnail generation
 */

export interface VideoMetadata {
  duration: number; // in seconds
  fileSize: number; // in bytes
  width?: number;
  height?: number;
}

export const MAX_VIDEO_DURATION = 30; // seconds
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Check if a video URL has audio tracks
 * @param videoUrl URL of the video to check
 * @returns Promise that resolves to true if video has audio, false otherwise
 */
export async function checkVideoHasAudio(videoUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.muted = true; // Start muted to allow autoplay
      video.playsInline = true;
      video.preload = 'metadata';
      video.crossOrigin = 'anonymous';
      
      // Hide video element
      video.style.position = 'fixed';
      video.style.top = '-9999px';
      video.style.left = '-9999px';
      video.style.width = '1px';
      video.style.height = '1px';
      video.style.opacity = '0';
      video.style.pointerEvents = 'none';
      video.style.zIndex = '-1';
      video.style.visibility = 'hidden';
      
      let hasAudio = false;
      let checkComplete = false;
      
      const cleanup = () => {
        video.pause();
        video.src = '';
        if (video.parentNode) {
          video.parentNode.removeChild(video);
        }
        URL.revokeObjectURL(videoUrl);
      };
      
      // Method 1: Check audioTracks (older API, may not be available)
      if ('audioTracks' in video && (video as any).audioTracks && (video as any).audioTracks.length > 0) {
        hasAudio = true;
        checkComplete = true;
        cleanup();
        resolve(true);
        return;
      }
      
      // Method 2: Try to create MediaStream and check for audio tracks
      video.onloadedmetadata = () => {
        try {
          // Try captureStream if available (Chrome, Edge)
          if ((video as any).captureStream) {
            const stream = (video as any).captureStream();
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length > 0) {
              hasAudio = true;
              checkComplete = true;
              cleanup();
              resolve(true);
              return;
            }
          }
          
          // Method 3: Try to play video and check if audio context can detect audio
          // This is a fallback method
          video.oncanplay = () => {
            try {
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
              const source = audioContext.createMediaElementSource(video);
              const analyser = audioContext.createAnalyser();
              source.connect(analyser);
              analyser.connect(audioContext.destination);
              
              // Try to play a tiny bit to check for audio
              video.currentTime = 0.1;
              video.play().then(() => {
                setTimeout(() => {
                  video.pause();
                  // If we got here without errors and can create audio context, likely has audio
                  // This is not 100% reliable but better than nothing
                  hasAudio = true;
                  checkComplete = true;
                  audioContext.close();
                  cleanup();
                  resolve(true);
                }, 100);
              }).catch(() => {
                // If play fails, assume no audio or can't determine
                checkComplete = true;
                audioContext.close();
                cleanup();
                resolve(false);
              });
            } catch (error) {
              // If audio context fails, assume we can't determine
              checkComplete = true;
              cleanup();
              resolve(false);
            }
          };
          
          // Fallback: if no audio detected after timeout, assume no audio
          setTimeout(() => {
            if (!checkComplete) {
              checkComplete = true;
              cleanup();
              // Default to true to be safe (assume audio exists unless proven otherwise)
              resolve(true);
            }
          }, 2000);
        } catch (error) {
          checkComplete = true;
          cleanup();
          // Default to true to be safe
          resolve(true);
        }
      };
      
      video.onerror = () => {
        if (!checkComplete) {
          checkComplete = true;
          cleanup();
          resolve(false);
        }
      };
      
      // Start loading
      video.load();
    } catch (error) {
      console.warn('Error checking video audio:', error);
      // Default to true to be safe (assume audio exists)
      resolve(true);
    }
  });
}

// Compression settings for client-side video compression
export const COMPRESSION_SETTINGS = {
  maxWidth: 1920,        // Full HD
  maxHeight: 1080,       // Full HD
  bitrate: 2500000,      // 2.5 Mbps (good balance between quality and size)
  codec: 'h264',         // Universally supported
  maxFileSize: 10 * 1024 * 1024, // 10MB after compression
  compressionThreshold: 5 * 1024 * 1024, // Compress files larger than 5MB
};

/**
 * Compress video using MediaRecorder API (client-side)
 * Works in all modern browsers (Chrome, Firefox, Safari, Edge)
 * 
 * @param file Original video file
 * @param onProgress Optional progress callback (0-100)
 * @returns Compressed video file as Blob, or original file if compression fails
 */
export async function compressVideo(
  file: File,
  onProgress?: (progress: number) => void
): Promise<File> {
  // Only compress if file is larger than threshold
  if (file.size < COMPRESSION_SETTINGS.compressionThreshold) {
    console.log('📹 Video is small enough, skipping compression');
    return file;
  }

  // Check if MediaRecorder is supported
  if (!window.MediaRecorder) {
    console.warn('⚠️ MediaRecorder not supported, using original file');
    return file;
  }

  return new Promise((resolve) => {
    try {
      // Create video element to load the file
      // IMPORTANT: Don't add to DOM to avoid any layout/scroll issues
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      video.src = url;
      video.muted = true; // Mute to allow autoplay
      video.playsInline = true;
      video.preload = 'metadata';
      video.crossOrigin = 'anonymous';
      // Hide video element completely - don't add to DOM, make it invisible
      video.style.position = 'fixed';
      video.style.top = '-9999px';
      video.style.left = '-9999px';
      video.style.width = '1px';
      video.style.height = '1px';
      video.style.opacity = '0';
      video.style.pointerEvents = 'none';
      video.style.zIndex = '-1';
      video.style.visibility = 'hidden';
      video.tabIndex = -1; // Prevent focus
      // CRITICAL: Don't add to DOM to avoid any layout/scroll issues
      // The video element will work without being in the DOM

      let mediaRecorder: MediaRecorder | null = null;
      let canvas: HTMLCanvasElement | null = null;
      let ctx: CanvasRenderingContext2D | null = null;
      let animationFrameId: number | null = null;

      const cleanup = () => {
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          try {
            mediaRecorder.stop();
          } catch (e) {
            // Ignore errors when stopping
          }
        }
        if (video) {
          video.pause();
          video.src = '';
          // Remove video element from DOM if it was added
          if (video.parentNode) {
            video.parentNode.removeChild(video);
          }
        }
        URL.revokeObjectURL(url);
        if (canvas) {
          canvas.width = 0;
          canvas.height = 0;
          // Remove canvas element from DOM if it was added
          if (canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
          }
        }
      };

      video.onloadedmetadata = () => {
        onProgress?.(10);

        // Calculate new dimensions maintaining aspect ratio
        let width = video.videoWidth;
        let height = video.videoHeight;
        
        if (width > COMPRESSION_SETTINGS.maxWidth || height > COMPRESSION_SETTINGS.maxHeight) {
          const ratio = Math.min(
            COMPRESSION_SETTINGS.maxWidth / width,
            COMPRESSION_SETTINGS.maxHeight / height
          );
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Ensure even dimensions (required for some codecs)
        width = width % 2 === 0 ? width : width - 1;
        height = height % 2 === 0 ? height : height - 1;

        console.log(`📹 Compressing video: ${video.videoWidth}x${video.videoHeight} → ${width}x${height}`);

        // Create canvas to capture video frames
        // Hide it completely so it doesn't affect page layout or scrolling
        canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        // Hide canvas element completely - don't add to DOM
        canvas.style.position = 'fixed';
        canvas.style.top = '-9999px';
        canvas.style.left = '-9999px';
        canvas.style.width = '1px';
        canvas.style.height = '1px';
        canvas.style.opacity = '0';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '-1';
        // Don't add to DOM to avoid any layout/scroll issues
        ctx = canvas.getContext('2d', { willReadFrequently: false });
        if (!ctx) {
          console.warn('⚠️ Could not get canvas context, using original file');
          cleanup();
          resolve(file);
          return;
        }

        // Determine best MIME type for MediaRecorder
        let mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm;codecs=vp8';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              // Fallback: try MP4 if supported (Safari)
              if (MediaRecorder.isTypeSupported('video/mp4')) {
                mimeType = 'video/mp4';
              } else {
                console.warn('⚠️ No suitable MediaRecorder codec found, using original file');
                cleanup();
                resolve(file);
                return;
              }
            }
          }
        }

        console.log(`📹 Using codec: ${mimeType}`);

        // Create MediaStream that includes both video and audio
        // First, try to get stream directly from video element (preserves audio)
        let stream: MediaStream;
        let useCanvasForVideo = false;
        
        try {
          // Try to use video element's captureStream (preserves audio if available)
          if ((video as any).captureStream) {
            stream = (video as any).captureStream(30);
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length > 0) {
              console.log(`📹 Using video.captureStream with ${audioTracks.length} audio track(s)`);
              // We have audio, but we still need to resize video via canvas
              // So we'll replace the video track with canvas track but keep audio
              const canvasStream = canvas.captureStream(30);
              const videoTracks = canvasStream.getVideoTracks();
              const combinedStream = new MediaStream();
              
              // Add resized video track from canvas
              videoTracks.forEach(track => {
                combinedStream.addTrack(track);
              });
              
              // Add original audio tracks
              audioTracks.forEach(track => {
                combinedStream.addTrack(track);
              });
              
              stream = combinedStream;
            } else {
              console.log('📹 Video has no audio track, using canvas stream only');
              stream = canvas.captureStream(30);
              useCanvasForVideo = true;
            }
          } else {
            // Fallback: use canvas stream (no audio)
            console.warn('⚠️ captureStream not supported, using canvas only (no audio)');
            stream = canvas.captureStream(30);
            useCanvasForVideo = true;
          }
        } catch (error) {
          console.warn('⚠️ Error creating stream, using canvas only:', error);
          stream = canvas.captureStream(30);
          useCanvasForVideo = true;
        }
        
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: mimeType,
          videoBitsPerSecond: COMPRESSION_SETTINGS.bitrate,
          audioBitsPerSecond: 128000, // 128 kbps for audio (if available)
        });

        const chunks: Blob[] = [];
        let startTime = Date.now();
        let frameCount = 0;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunks.push(event.data);
            // Estimate progress based on video playback
            const estimatedProgress = Math.min(90, 10 + (frameCount / 30) * 2); // Rough estimate
            onProgress?.(estimatedProgress);
          }
        };

        mediaRecorder.onstop = () => {
          const duration = Date.now() - startTime;
          const compressedBlob = new Blob(chunks, { type: mimeType });
          const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
          const compressedSizeMB = (compressedBlob.size / (1024 * 1024)).toFixed(2);
          const reduction = ((1 - compressedBlob.size / file.size) * 100).toFixed(1);

          console.log(`✅ Video compressed: ${originalSizeMB}MB → ${compressedSizeMB}MB (${reduction}% reduction) in ${(duration / 1000).toFixed(1)}s`);

          cleanup();
          onProgress?.(100);

          // If compression didn't help (file is larger or similar), use original
          if (compressedBlob.size >= file.size * 0.95) {
            console.warn('⚠️ Compression did not reduce size significantly, using original file');
            resolve(file);
            return;
          }

          // Convert blob to File
          const extension = mimeType.includes('webm') ? '.webm' : '.mp4';
          const compressedFile = new File(
            [compressedBlob],
            file.name.replace(/\.[^/.]+$/, extension),
            {
              type: mimeType,
              lastModified: Date.now()
            }
          );

          resolve(compressedFile);
        };

        mediaRecorder.onerror = (error) => {
          console.error('❌ MediaRecorder error:', error);
          cleanup();
          // Fallback to original file on error
          resolve(file);
        };

        // Start recording
        mediaRecorder.start(100); // Collect data every 100ms
        onProgress?.(20);

        // Draw video frames to canvas
        const drawFrame = () => {
          if (!video || !ctx || !canvas || video.paused || video.ended || !mediaRecorder || mediaRecorder.state === 'inactive') {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
              setTimeout(() => {
                if (mediaRecorder && mediaRecorder.state === 'recording') {
                  mediaRecorder.stop();
                }
              }, 500);
            }
            return;
          }

          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            frameCount++;
            animationFrameId = requestAnimationFrame(drawFrame);
          } catch (error) {
            console.error('❌ Error drawing frame:', error);
            if (mediaRecorder && mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
            }
          }
        };

        // Play video to capture frames
        video.onplay = () => {
          onProgress?.(30);
          drawFrame();
        };

        video.onended = () => {
          onProgress?.(95);
          setTimeout(() => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
            }
          }, 500);
        };

        // Start playing video
        // Use requestAnimationFrame and ensure video doesn't block scroll
        // Also prevent any scroll blocking by the video element
        requestAnimationFrame(() => {
          // Ensure video doesn't interfere with scroll
          video.setAttribute('tabindex', '-1');
          video.setAttribute('aria-hidden', 'true');
          
          video.play().catch((error) => {
            console.error('❌ Error playing video for compression:', error);
            cleanup();
            resolve(file); // Fallback to original
          });
        });

        // Timeout safety: stop after max duration + buffer
        setTimeout(() => {
          if (mediaRecorder && mediaRecorder.state === 'recording') {
            console.warn('⚠️ Compression timeout, stopping recording');
            mediaRecorder.stop();
            video.pause();
          }
        }, (MAX_VIDEO_DURATION + 5) * 1000); // Max duration + 5 seconds buffer
      };

      video.onerror = (error) => {
        console.error('❌ Error loading video for compression:', error);
        cleanup();
        resolve(file); // Fallback to original file
      };
    } catch (error: any) {
      console.error('❌ Error during video compression:', error);
      // Always fallback to original file on error
      resolve(file);
    }
  });
}

// Comprehensive list of allowed video MIME types
// Includes formats from various phones, apps, and platforms
// Based on common formats used by: Snapchat, TikTok, Instagram, WhatsApp, iOS, Android, etc.
export const ALLOWED_VIDEO_TYPES = [
  // Standard formats
  'video/mp4',
  'video/webm',
  'video/quicktime', // MOV files (iOS, Snapchat)
  'video/mov', // MOV files (alternative)
  'video/x-msvideo', // AVI
  'video/avi', // AVI alternative
  
  // Mobile formats
  'video/3gpp', // 3GP (Android phones, WhatsApp)
  'video/3gpp2', // 3G2
  'video/mp4v-es', // MP4 variant (older mobile)
  
  // Container formats
  'video/x-matroska', // MKV
  'video/x-m4v', // M4V (iTunes, iOS)
  'video/ogg', // OGG
  'video/ogv', // OGG video
  
  // Legacy formats
  'video/x-flv', // FLV (Flash)
  'video/x-ms-wmv', // WMV
  'video/x-ms-asf', // ASF/WMV
  
  // Additional formats for maximum compatibility
  'video/h264', // H.264 direct
  'video/h265', // H.265/HEVC direct
  'video/hevc', // HEVC alternative
  'video/x-ms-wm', // Windows Media
  'video/x-ms-wvx', // Windows Media
  'video/x-ms-wmx', // Windows Media
  'video/vnd.rn-realvideo', // RealVideo
  'video/x-realvideo', // RealVideo alternative
  'video/x-sgi-movie', // SGI Movie
  'video/x-matroska-3d', // MKV 3D
  'video/x-msvideo', // AVI (alternative)
  'video/vnd.vivo', // Vivo
  'video/vnd.mpegurl', // M3U8 (HLS)
  'video/x-mpegurl', // M3U8 alternative
  'video/x-ms-asf-plugin', // ASF plugin
];

// Allowed video file extensions (as fallback when MIME type is missing or incorrect)
// Includes extensions from all major platforms and apps
export const ALLOWED_VIDEO_EXTENSIONS = [
  // Standard formats
  '.mp4', '.m4v', '.mov', '.webm', '.avi',
  
  // Mobile formats
  '.3gp', '.3g2', '.3gpp', '.3gpp2',
  
  // Container formats
  '.mkv', '.ogv', '.ogg',
  
  // Legacy formats
  '.flv', '.wmv', '.asf', '.asx',
  
  // Additional formats
  '.rm', '.rmvb', // RealMedia
  '.vob', // DVD Video
  '.ts', '.mts', '.m2ts', // MPEG Transport Stream
  '.mxf', // Material Exchange Format
  '.divx', '.xvid', // DivX/Xvid
  '.f4v', // Flash Video (alternative)
  '.m4a', // Sometimes used for video
  '.mpg', '.mpeg', '.m2v', // MPEG
  '.mpv', // MPEG variant
  '.qt', // QuickTime (alternative)
  '.yuv', // YUV raw video
  '.dv', // Digital Video
  '.amv', // AMV (Chinese format)
  '.bik', // Bink Video
  '.nsv', // Nullsoft Streaming Video
];

/**
 * Validate video file
 * Uses both MIME type and file extension for maximum compatibility
 */
export function validateVideo(file: File): { valid: boolean; error?: string } {
  const fileType = file.type?.toLowerCase() || '';
  const fileName = file.name?.toLowerCase() || '';
  
  // Check if MIME type is allowed
  const hasAllowedMimeType = fileType && ALLOWED_VIDEO_TYPES.includes(fileType);
  
  // Check if file extension is allowed (fallback for missing/incorrect MIME types)
  const hasAllowedExtension = ALLOWED_VIDEO_EXTENSIONS.some(ext => fileName.endsWith(ext));
  
  // Accept if either MIME type OR extension is valid
  // This handles cases where:
  // - MIME type is missing (empty string)
  // - MIME type is incorrect but extension is valid
  // - Video was edited/compressed and MIME type changed
  const isAllowedType = hasAllowedMimeType || hasAllowedExtension;
  
  // For social media videos, be extra lenient
  // If it looks like a video file (has video/ prefix or common video extension), accept it
  const isSocialMedia = isSocialMediaVideo(file);
  const looksLikeVideo = fileType.startsWith('video/') || 
                         fileName.match(/\.(mp4|mov|webm|avi|3gp|mkv|m4v|ogv|flv|wmv|asf|rm|vob|ts|mts|mxf|divx|f4v|mpg|mpeg|qt|dv|amv)$/i);
  
  if (!isAllowedType && !(isSocialMedia && looksLikeVideo)) {
    return {
      valid: false,
      error: `Video formaat niet ondersteund. Toegestane formaten: MP4, WebM, MOV, AVI, 3GP, MKV, M4V, en meer. Jouw bestand: ${fileType || 'onbekend type'}${fileName ? ` (${fileName})` : ''}`
    };
  }
  
  // Log if we're accepting a non-standard format
  if (!isAllowedType && isSocialMedia && looksLikeVideo) {
    console.warn('⚠️ Accepting social media video with non-standard format:', {
      fileName,
      fileType: fileType || 'missing',
      reason: 'social media video detected'
    });
  }

  // Check file size (50MB max)
  if (file.size > MAX_VIDEO_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Video is te groot (${sizeMB}MB). Maximum 50MB toegestaan.`
    };
  }

  return { valid: true };
}

/**
 * Get video metadata (duration, size, dimensions)
 * More robust error handling for edited/compressed videos
 */
/**
 * Check if video is likely HEVC/H.265 encoded
 * HEVC videos often fail metadata validation in browsers but are still valid files
 */
function isLikelyHEVC(file: File): boolean {
  const fileName = file.name?.toLowerCase() || '';
  const fileType = file.type?.toLowerCase() || '';
  
  // Check for HEVC indicators
  // Snapchat videos are often HEVC, check filename patterns
  if (fileName.includes('snapchat') || fileName.includes('snap')) {
    return true;
  }
  
  // Check for HEVC MIME types (some browsers report this)
  if (fileType.includes('hevc') || fileType.includes('h265') || fileType.includes('h.265')) {
    return true;
  }
  
  // Check file extension - MP4 can contain HEVC
  // We can't detect codec from extension alone, but Snapchat videos are often HEVC
  return false;
}

export function getVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const isHEVC = isLikelyHEVC(file);
    
    if (isHEVC) {
      console.warn('⚠️ HEVC/H.265 video gedetecteerd - metadata validatie kan falen in browser, maar upload wordt toegestaan');
    }
    
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    
    let objectUrl: string | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let hevcErrorHandled = false;

    const cleanup = () => {
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    // For HEVC videos, use longer timeout (they may take longer or fail completely)
    const timeoutDuration = isHEVC ? 30000 : 20000;
    timeoutId = setTimeout(() => {
      if (!resolved) {
        if (isHEVC) {
          // For HEVC, don't reject - just resolve with minimal metadata
          console.warn('⚠️ HEVC video metadata timeout - allowing upload without duration check');
          resolved = true;
          cleanup();
          resolve({
            duration: 0, // Unknown duration, but allow upload
            fileSize: file.size,
            width: undefined,
            height: undefined
          });
        } else {
          cleanup();
          reject(new Error('Video metadata laden duurde te lang'));
        }
      }
    }, timeoutDuration);

    let resolved = false;
    
    const resolveMetadata = () => {
      if (resolved) return;
      resolved = true;
      cleanup();
      const duration = isNaN(video.duration) || !isFinite(video.duration) ? 0 : video.duration;
      resolve({
        duration: duration,
        fileSize: file.size,
        width: video.videoWidth || undefined,
        height: video.videoHeight || undefined
      });
    };

    video.onloadedmetadata = () => {
      resolveMetadata();
    };

    video.onerror = (e) => {
      if (resolved) return;
      const error = video.error;
      if (error) {
        // HEVC videos often get MEDIA_ERR_SRC_NOT_SUPPORTED (code 4)
        // This is normal - the browser can't decode HEVC but the file is still valid
        if (error.code === 4) { // MEDIA_ERR_SRC_NOT_SUPPORTED
          if (isHEVC || isLikelyHEVCVideo(file)) {
            console.warn('⚠️ HEVC codec niet ondersteund door browser - dit is normaal, upload wordt toegestaan');
            hevcErrorHandled = true;
            // For HEVC, resolve with minimal metadata instead of rejecting
            resolved = true;
            cleanup();
            resolve({
              duration: 0, // Unknown duration, but allow upload
              fileSize: file.size,
              width: undefined,
              height: undefined
            });
            return;
          }
          console.warn('Video codec niet ondersteund door browser, maar bestand kan nog steeds geldig zijn');
          // Don't reject - let the timeout or other handlers deal with it
          return;
        }
        // For other errors, reject
        resolved = true;
        cleanup();
        const errorMessage = `Video fout (code ${error.code}): ${error.message || 'onbekende fout'}`;
        reject(new Error(errorMessage));
      }
    };

    // Also handle canplay event as fallback
    video.oncanplay = () => {
      if (video.readyState >= 2 && !resolved) { // HAVE_CURRENT_DATA
        resolveMetadata();
      }
    };

    try {
      objectUrl = URL.createObjectURL(file);
      video.src = objectUrl;
      video.load(); // Explicitly load the video
    } catch (err) {
      cleanup();
      reject(new Error('Kon video bestand niet openen'));
    }
  });
}

/**
 * Check if video is likely HEVC/H.265 encoded
 * Exported for use in other modules
 * Detects HEVC videos from various sources: Snapchat, iOS, modern Android, etc.
 */
export function isLikelyHEVCVideo(file: File): boolean {
  const fileName = file.name?.toLowerCase() || '';
  const fileType = file.type?.toLowerCase() || '';
  
  // Check for HEVC indicators in filename (common patterns)
  const hevcFileNamePatterns = [
    'snapchat', 'snap',
    'hevc', 'h265', 'h.265',
    'iphone', 'ios', // iOS often uses HEVC
    'imovie', // iMovie exports often use HEVC
  ];
  
  if (hevcFileNamePatterns.some(pattern => fileName.includes(pattern))) {
    return true;
  }
  
  // Check MIME type
  if (fileType.includes('hevc') || fileType.includes('h265') || fileType.includes('h.265')) {
    return true;
  }
  
  // Check for iOS/MOV files which often contain HEVC
  // Especially if file size is reasonable but metadata fails
  if ((fileType.includes('quicktime') || fileType.includes('mov')) && fileName.includes('iphone')) {
    return true;
  }
  
  return false;
}

/**
 * Check if video is from a social media app or mobile source
 * These videos often have special handling needs
 */
export function isSocialMediaVideo(file: File): boolean {
  const fileName = file.name?.toLowerCase() || '';
  
  const socialMediaPatterns = [
    'snapchat', 'snap',
    'tiktok', 'tik-tok',
    'instagram', 'ig_',
    'whatsapp', 'wa_',
    'facebook', 'fb_',
    'twitter', 'tw_',
    'telegram', 'tg_',
    'signal',
    'messenger',
    'imessage',
    'iphone',
    'android',
    'camera',
    'dcim', // Digital Camera Images (Android)
    'screenshots',
    'screen_recording',
    'screen-record',
  ];
  
  return socialMediaPatterns.some(pattern => fileName.includes(pattern));
}

/**
 * Validate video duration (max 30 seconds)
 * More lenient for videos where metadata can't be loaded
 * Especially lenient for HEVC videos which often can't be validated in browser
 */
export async function validateVideoDuration(file: File): Promise<{ valid: boolean; duration?: number; error?: string }> {
  const isHEVC = isLikelyHEVCVideo(file);
  
  if (isHEVC) {
    console.warn('⚠️ HEVC video gedetecteerd - duration validatie wordt overgeslagen (browser kan HEVC niet valideren)');
    // For HEVC videos, we can't validate duration in browser
    // Allow upload and let server handle it if needed
    return {
      valid: true,
      duration: undefined
    };
  }
  
  try {
    const metadata = await getVideoMetadata(file);
    
    // If duration is 0 or invalid, we can't validate but allow upload
    // (some edited/compressed videos may have metadata issues)
    if (!metadata.duration || metadata.duration === 0) {
      console.warn('Video duration kon niet worden bepaald, maar bestand wordt geaccepteerd');
      return {
        valid: true,
        duration: undefined
      };
    }
    
    if (metadata.duration > MAX_VIDEO_DURATION) {
      return {
        valid: false,
        duration: metadata.duration,
        error: `Video is te lang (${Math.ceil(metadata.duration)} seconden). Maximum ${MAX_VIDEO_DURATION} seconden toegestaan.`
      };
    }

    return {
      valid: true,
      duration: metadata.duration
    };
  } catch (error: any) {
    // If metadata loading fails, log but don't block upload
    // Some edited/compressed videos may have codec issues but still play fine
    // HEVC videos especially will fail here
    const errorMsg = error?.message || String(error);
    if (errorMsg.includes('codec') || errorMsg.includes('niet ondersteund') || errorMsg.includes('not supported')) {
      console.warn('⚠️ Video codec niet ondersteund door browser (mogelijk HEVC) - upload wordt toegestaan');
    } else {
      console.warn('Video metadata kon niet worden geladen, maar bestand wordt geaccepteerd:', errorMsg);
    }
    return {
      valid: true,
      duration: undefined,
      // Don't set error - allow upload to proceed
    };
  }
}

/**
 * Generate thumbnail from video
 * Improved with better error handling and timeout
 * Handles HEVC videos gracefully (may fail but won't block upload)
 */
export function generateVideoThumbnail(file: File, timeInSeconds: number = 1): Promise<string> {
  return new Promise((resolve, reject) => {
    const isHEVC = isLikelyHEVCVideo(file);
    
    if (isHEVC) {
      console.warn('⚠️ HEVC video - thumbnail generatie kan falen, maar upload gaat door');
    }
    
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    
    let objectUrl: string | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let seekTimeoutId: NodeJS.Timeout | null = null;
    let hevcErrorHandled = false;

    const cleanup = () => {
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (seekTimeoutId) {
        clearTimeout(seekTimeoutId);
        seekTimeoutId = null;
      }
    };

    // For HEVC videos, use longer timeout or fail gracefully
    const timeoutDuration = isHEVC ? 20000 : 15000;
    timeoutId = setTimeout(() => {
      cleanup();
      if (isHEVC) {
        // For HEVC, reject but with a message that indicates it's okay
        reject(new Error('HEVC_THUMBNAIL_NOT_SUPPORTED'));
      } else {
        reject(new Error('Thumbnail generatie duurde te lang'));
      }
    }, timeoutDuration);

    video.onloadeddata = () => {
      // Seek to a valid time position
      const seekTime = Math.min(timeInSeconds, Math.max(0.1, (video.duration || 1) * 0.1));
      video.currentTime = seekTime;
      
      // Timeout for seek operation
      seekTimeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Kon niet naar juiste tijdpositie in video springen'));
      }, 5000);
    };

    video.onseeked = () => {
      if (seekTimeoutId) {
        clearTimeout(seekTimeoutId);
        seekTimeoutId = null;
      }

      // Check if video has valid dimensions
      if (!video.videoWidth || !video.videoHeight || video.videoWidth === 0 || video.videoHeight === 0) {
        cleanup();
        reject(new Error('Video heeft geen geldige afmetingen'));
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        cleanup();
        reject(new Error('Kon canvas context niet maken'));
        return;
      }

      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            cleanup();
            if (blob) {
              const reader = new FileReader();
              reader.onload = () => {
                if (reader.result) {
                  resolve(reader.result as string);
                } else {
                  reject(new Error('Kon thumbnail niet lezen'));
                }
              };
              reader.onerror = () => reject(new Error('Kon thumbnail niet lezen'));
              reader.readAsDataURL(blob);
            } else {
              reject(new Error('Kon thumbnail niet genereren'));
            }
          },
          'image/jpeg',
          0.8
        );
      } catch (drawError: any) {
        cleanup();
        reject(new Error(`Fout bij tekenen van thumbnail: ${drawError.message || 'onbekende fout'}`));
      }
    };

    video.onerror = (e) => {
      const error = video.error;
      if (error) {
        // HEVC videos often get MEDIA_ERR_SRC_NOT_SUPPORTED (code 4)
        if (error.code === 4 && (isHEVC || isLikelyHEVCVideo(file))) {
          console.warn('⚠️ HEVC codec niet ondersteund voor thumbnail - dit is normaal');
          hevcErrorHandled = true;
          cleanup();
          reject(new Error('HEVC_THUMBNAIL_NOT_SUPPORTED'));
          return;
        }
        cleanup();
        const errorMessage = error 
          ? `Video fout (code ${error.code}): ${error.message || 'onbekende fout'}`
          : 'Kon video niet laden voor thumbnail';
        reject(new Error(errorMessage));
      } else {
        cleanup();
        reject(new Error('Kon video niet laden voor thumbnail'));
      }
    };

    // Also handle canplay event as fallback
    video.oncanplay = () => {
      if (video.readyState >= 2 && !video.currentTime) {
        // If video can play but currentTime is still 0, try seeking
        video.currentTime = Math.min(timeInSeconds, Math.max(0.1, (video.duration || 1) * 0.1));
      }
    };

    try {
      objectUrl = URL.createObjectURL(file);
      video.src = objectUrl;
      video.load(); // Explicitly load the video
    } catch (err) {
      cleanup();
      reject(new Error('Kon video bestand niet openen'));
    }
  });
}

/**
 * Full video validation including duration check
 * Very lenient - allows upload even if metadata can't be loaded
 * Designed to work with edited/compressed videos that may have metadata issues
 */
export async function validateVideoFile(file: File): Promise<{ valid: boolean; duration?: number; metadata?: VideoMetadata; error?: string }> {
  // Basic validation (file type and size) - this is the only required check
  const basicValidation = validateVideo(file);
  if (!basicValidation.valid) {
    return basicValidation;
  }

  // Try duration validation, but be very tolerant
  let durationValidation: { valid: boolean; duration?: number; error?: string } = { valid: true };
  try {
    durationValidation = await validateVideoDuration(file);
    
    // Only fail if there's an actual error about duration being too long
    // All other errors (metadata issues, codec problems, etc.) are ignored
    if (!durationValidation.valid && durationValidation.error) {
      // Check if it's specifically about duration being too long
      if (durationValidation.error.includes('te lang') || durationValidation.error.includes('too long')) {
        // This is a real blocker - video is too long
        return durationValidation;
      }
      // For other errors, log but allow upload
      console.warn('Video duration validation had issues, but allowing upload:', durationValidation.error);
      durationValidation = { valid: true, duration: undefined };
    }
  } catch (error: any) {
    // Duration validation completely failed - that's okay for edited/compressed videos
    console.warn('Video duration validation failed, but allowing upload (common for edited/compressed videos):', error?.message || error);
    durationValidation = { valid: true, duration: undefined };
  }

  // Try to get full metadata, but don't fail if it doesn't work
  // This is especially important for edited/compressed videos
  try {
    const metadata = await getVideoMetadata(file);
    const duration = metadata.duration || durationValidation.duration;
    return {
      valid: true,
      duration: duration !== null && duration !== undefined ? duration : undefined,
      metadata
    };
  } catch (error: any) {
    // Metadata loading failed completely - that's fine
    // Many edited/compressed videos have metadata issues but still work fine
    console.warn('Video metadata kon niet worden geladen, maar bestand wordt geaccepteerd (normaal voor bewerkte/gecomprimeerde video\'s):', error?.message || error);
    const duration = durationValidation.duration;
    return {
      valid: true,
      duration: duration !== null && duration !== undefined ? duration : undefined,
      // No metadata, but that's perfectly okay for edited/compressed videos
    };
  }
}



