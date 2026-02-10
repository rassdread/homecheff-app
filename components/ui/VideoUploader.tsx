'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { validateVideoFile, validateVideo, generateVideoThumbnail, MAX_VIDEO_DURATION, isLikelyHEVCVideo, compressVideo, COMPRESSION_SETTINGS } from '@/lib/videoUtils';
import { useTranslation } from '@/hooks/useTranslation';

interface VideoUploaderProps {
  value?: {
    url: string;
    thumbnail?: string | null;
    duration?: number | null;
  } | null;
  onChange?: (video: { url: string; thumbnail?: string | null; duration?: number | null } | null) => void;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
  maxDuration?: number; // in seconds, default 30
  disabled?: boolean;
  className?: string;
}

export default function VideoUploader({
  value,
  onChange,
  onUploadStart,
  onUploadEnd,
  maxDuration = MAX_VIDEO_DURATION,
  disabled = false,
  className = ''
}: VideoUploaderProps) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(value?.url || null);
  const [thumbnail, setThumbnail] = useState<string | null>(value?.thumbnail || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview and thumbnail when value prop changes (e.g., when editing existing recipe)
  useEffect(() => {
    if (value?.url) {
      // Update preview if we have a video URL
      setPreview(value.url);
      setThumbnail(value.thumbnail || null);
    } else if (value === null || value === undefined) {
      // Only clear if value is explicitly set to null/undefined (user removed video)
      // Don't clear on initial mount if value is undefined
      if (preview) {
        setPreview(null);
        setThumbnail(null);
      }
    }
  }, [value?.url, value?.thumbnail]); // Update when value changes - removed 'value' to prevent infinite loops

  // Chunked upload to Vercel Blob for large files (bypasses 4.5MB serverless function limit)
  // Upload file in 2MB chunks and reassemble on server
  const uploadDirectToBlob = async (file: File, signal: AbortSignal): Promise<Response> => {
    try {
      const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks (safe for Vercel's 4.5MB limit)
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      
      console.log(`📦 Starting chunked upload: ${totalChunks} chunks of ${(CHUNK_SIZE / (1024 * 1024)).toFixed(1)}MB each`);

      // Initialize upload session
      const initResponse = await fetch('/api/upload/video-chunked/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          totalChunks
        }),
        signal
      });

      if (!initResponse.ok) {
        const errorData = await initResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Kon upload sessie niet initialiseren');
      }

      const { uploadId } = await initResponse.json();

      // Upload chunks sequentially
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        if (signal.aborted) {
          throw new Error('Upload geannuleerd');
        }

        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        console.log(`📤 Uploading chunk ${chunkIndex + 1}/${totalChunks} (${((end - start) / (1024 * 1024)).toFixed(2)}MB)`);

        const chunkFormData = new FormData();
        chunkFormData.append('chunk', chunk);
        chunkFormData.append('uploadId', uploadId);
        chunkFormData.append('chunkIndex', chunkIndex.toString());
        chunkFormData.append('totalChunks', totalChunks.toString());

        const chunkResponse = await fetch('/api/upload/video-chunked/chunk', {
          method: 'POST',
          body: chunkFormData,
          signal
        });

        if (!chunkResponse.ok) {
          const errorData = await chunkResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Chunk ${chunkIndex + 1} upload mislukt`);
        }
      }

      // Finalize upload - server will reassemble chunks
      console.log('✅ All chunks uploaded, finalizing...');
      const finalizeResponse = await fetch('/api/upload/video-chunked/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId }),
        signal
      });

      if (!finalizeResponse.ok) {
        const errorData = await finalizeResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Kon upload niet finaliseren');
      }

      return finalizeResponse;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Upload geannuleerd');
      }
      throw error;
    }
  };

  // Regular API upload for small files
  const uploadViaAPI = async (file: File, signal: AbortSignal): Promise<Response> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'video');

    return fetch('/api/upload', {
      method: 'POST',
      body: formData,
      signal
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    onUploadStart?.();

    // Create abort controller for timeout and cancellation
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 120000); // 2 minutes timeout

    try {
      // Validate video - very tolerant for edited/compressed videos
      // First do basic validation (format and size) - this is required
      const basicValidation = validateVideo(file);
      if (!basicValidation.valid) {
        const errorMsg = basicValidation.error || 'Video validatie mislukt';
        console.error('❌ Basic video validation failed:', errorMsg);
        setError(errorMsg);
        setUploading(false);
        onUploadEnd?.();
        clearTimeout(timeoutId);
        return;
      }

      // Check if this is likely a HEVC video (Snapchat, etc.)
      // HEVC videos often fail browser validation but are still valid
      const isHEVC = isLikelyHEVCVideo(file);
      if (isHEVC) {
        console.log('⚠️ HEVC/H.265 video gedetecteerd - metadata validatie kan falen, maar upload wordt toegestaan');
      }
      
      // Compress video if it's larger than threshold
      let fileToUpload = file;
      if (file.size > COMPRESSION_SETTINGS.compressionThreshold) {
        try {
          setCompressing(true);
          setCompressionProgress(0);
          console.log(`📹 Compressing video (${(file.size / (1024 * 1024)).toFixed(2)}MB)...`);
          
          fileToUpload = await compressVideo(file, (progress) => {
            setCompressionProgress(progress);
          });
          
          const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
          const compressedSizeMB = (fileToUpload.size / (1024 * 1024)).toFixed(2);
          const reduction = ((1 - fileToUpload.size / file.size) * 100).toFixed(1);
          
          if (fileToUpload.size < file.size) {
            console.log(`✅ Video compressed: ${originalSizeMB}MB → ${compressedSizeMB}MB (${reduction}% reduction)`);
          } else {
            console.log(`ℹ️ Using original file (compression didn't reduce size)`);
          }
        } catch (compressionError) {
          console.warn('⚠️ Video compression failed, using original file:', compressionError);
          // Continue with original file if compression fails
          fileToUpload = file;
        } finally {
          setCompressing(false);
          setCompressionProgress(0);
        }
      } else {
        console.log(`📹 Video is small (${(file.size / (1024 * 1024)).toFixed(2)}MB), skipping compression`);
      }
      
      // For videos larger than 3.5MB, use chunked upload to bypass serverless function limit (4.5MB)
      // After compression, most videos will be under this threshold, so chunked upload is rarely needed
      // But we keep it as fallback for uncompressed or poorly compressed videos
      const useDirectBlobUpload = fileToUpload.size > 3.5 * 1024 * 1024; // 3.5MB threshold (safe margin below 4.5MB limit)

      console.log('📤 Starting video upload:', {
        fileName: fileToUpload.name,
        fileSize: `${(fileToUpload.size / (1024 * 1024)).toFixed(2)}MB`,
        fileType: fileToUpload.type,
        isHEVC: isHEVC,
        useDirectBlobUpload,
        wasCompressed: fileToUpload.size < file.size
      });

      // Run validation and thumbnail generation in parallel with upload
      // This speeds up the process significantly
      const [uploadResult, validationResult, thumbnailResult] = await Promise.allSettled([
        // Upload - use direct Blob upload for large files, regular API for small files
        // Use compressed file if available, otherwise original
        Promise.race([
          useDirectBlobUpload 
            ? uploadDirectToBlob(fileToUpload, abortController.signal)
            : uploadViaAPI(fileToUpload, abortController.signal),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Upload timeout')), 60000) // 60 seconds for upload
          )
        ]),
        // Validation - run in parallel, but don't block upload
        // Use original file for validation (compressed file might have different metadata)
        Promise.race([
          validateVideoFile(file),
          new Promise<{ valid: boolean; duration?: number }>((resolve) => 
            setTimeout(() => {
              console.warn('⚠️ Video validation timeout - allowing upload anyway');
              resolve({ valid: true, duration: undefined });
            }, 20000) // Reduced to 20 seconds
          )
        ]).catch(() => ({ valid: true, duration: undefined })),
        // Thumbnail - run in parallel, but don't block upload
        // Use original file for thumbnail (better quality)
        Promise.race([
          generateVideoThumbnail(file),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Thumbnail timeout')), isHEVC ? 10000 : 8000) // Faster timeout
          )
        ]).catch(() => null)
      ]);

      // Process upload result first (most important)
      let response: Response;
      if (uploadResult.status === 'fulfilled') {
        response = uploadResult.value as Response;
      } else {
        throw uploadResult.reason || new Error('Upload mislukt');
      }

      // Process validation result (for duration check)
      let validation: { valid: boolean; duration?: number; error?: string } = { valid: true };
      if (validationResult.status === 'fulfilled') {
        validation = validationResult.value;
      }

      // Only block if duration is explicitly too long
      if (!validation.valid && validation.error && (validation.error.includes('te lang') || validation.error.includes('duration'))) {
        // Cancel upload if we can
        abortController.abort();
        const errorMsg = validation.error;
        console.error('❌ Video validation failed (duration too long):', errorMsg);
        setError(errorMsg);
        setUploading(false);
        onUploadEnd?.();
        clearTimeout(timeoutId);
        return;
      }

      // Process thumbnail result
      let thumbnailUrl: string | null = null;
      if (thumbnailResult.status === 'fulfilled' && thumbnailResult.value) {
        thumbnailUrl = thumbnailResult.value;
        setThumbnail(thumbnailUrl);
      } else if (isHEVC) {
        console.warn('⚠️ HEVC video - thumbnail generatie niet ondersteund door browser (normaal)');
      }

      console.log('📥 Upload response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          // If response is not JSON, use status text
          errorData = { error: response.statusText || 'Upload mislukt' };
        }
        
        // Handle 413 Payload Too Large specifically
        if (response.status === 413) {
          const sizeMB = file ? (file.size / (1024 * 1024)).toFixed(1) : '';
          throw new Error(`Bestand is te groot (${sizeMB}MB). Maximum 50MB toegestaan. Probeer de video te comprimeren of gebruik een kortere video.`);
        }
        
        throw new Error(errorData.error || `Upload mislukt (${response.status})`);
      }

      let data: any;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('Kon server response niet verwerken');
      }

      if (!data?.url) {
        throw new Error('Geen URL ontvangen na upload');
      }

      const videoData = {
        url: data.url,
        thumbnail: thumbnailUrl,
        duration: validation.duration || null
      };

      setPreview(videoData.url);
      onChange?.(videoData);
      setError(null);

      // Ensure scroll container is still functional after upload
      // Simple, conservative approach that works for all browsers
      const restoreScroll = () => {
        // Find all scroll containers in forms
        const scrollContainers = document.querySelectorAll('[data-recipe-form], [data-garden-form], [data-design-form], [data-quickadd-form], [data-edit-product-form], [data-compact-chef-form], [data-compact-garden-form], [data-compact-designer-form]');
        
        scrollContainers.forEach((container) => {
          const el = container as HTMLElement;
          if (!el) return;
          
          // Only ensure basic scroll properties are set - don't change DOM structure
          // This works for all browsers including Chrome
          if (el.scrollHeight > el.clientHeight) {
            // Ensure overflow is set correctly
            const computedStyle = window.getComputedStyle(el);
            if (computedStyle.overflowY !== 'auto' && computedStyle.overflowY !== 'scroll') {
              el.style.overflowY = 'auto';
            }
            el.style.overflowX = 'hidden';
            el.style.touchAction = 'pan-y';
            
            // Browser-specific touch scrolling support
            if ('ontouchstart' in window) {
              (el.style as any).WebkitOverflowScrolling = 'touch';
            }
            
            // Force a reflow to ensure Chrome recognizes the scroll container
            void el.offsetHeight;
            
            // For Chrome: trigger a tiny scroll movement to activate scrolling
            const userAgent = navigator.userAgent.toLowerCase();
            const isChrome = /chrome/.test(userAgent) && !/edg|opr/.test(userAgent);
            const isEdge = /edg/.test(userAgent);
            
            if ((isChrome || isEdge) && el.scrollHeight > el.clientHeight) {
              // Small scroll activation for Chrome
              const currentScroll = el.scrollTop;
              requestAnimationFrame(() => {
                el.scrollTop = currentScroll + 0.1;
                requestAnimationFrame(() => {
                  el.scrollTop = currentScroll;
                });
              });
            }
          }
        });
        
        // Ensure body doesn't block scrolling
        if (document.body) {
          const bodyStyle = window.getComputedStyle(document.body);
          if (bodyStyle.overflow === 'hidden') {
            document.body.style.overflow = '';
          }
        }
      };
      
      // Restore immediately and after delays to ensure it works
      restoreScroll();
      setTimeout(restoreScroll, 50);
      setTimeout(restoreScroll, 200);
      setTimeout(restoreScroll, 500);

    } catch (err: any) {
      console.error('❌ Video upload error:', err);
      console.error('❌ Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        file: file?.name,
        fileSize: file?.size,
        fileType: file?.type,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        browser: typeof navigator !== 'undefined' ? {
          vendor: navigator.vendor,
          platform: navigator.platform,
          language: navigator.language
        } : 'unknown'
      });
      
      // Build comprehensive error message with all details
      let errorMessage = '';
      let errorDetails: string[] = [];
      
      // Main error message
      if (err.message) {
        if (err.message.includes('timeout') || err.message.includes('te lang')) {
          errorMessage = '⏱️ Upload timeout';
          errorDetails.push(`De upload duurde te lang (${err.message.includes('30') ? '30' : err.message.includes('45') ? '45' : '90'} seconden)`);
          errorDetails.push('Mogelijke oorzaken: trage internetverbinding, groot bestand, of serverproblemen');
        } else if (err.message.includes('te groot') || err.message.includes('too large') || err.message.includes('too big')) {
          const sizeMB = file ? (file.size / (1024 * 1024)).toFixed(1) : '';
          errorMessage = '📦 Bestand te groot';
          errorDetails.push(`Bestandsgrootte: ${sizeMB}MB`);
          errorDetails.push('Maximum toegestaan: 50MB');
          errorDetails.push('Oplossing: comprimeer de video of gebruik een kortere video');
        } else if (err.message.includes('formaat') || err.message.includes('niet ondersteund') || err.message.includes('not supported') || err.message.includes('format')) {
          errorMessage = '📹 Video formaat niet ondersteund';
          errorDetails.push(`Bestandstype: ${file?.type || 'onbekend type'}`);
          errorDetails.push(`Bestandsnaam: ${file?.name || 'onbekend'}`);
          errorDetails.push('Toegestane formaten: MP4, WebM, MOV, AVI, 3GP, MKV, M4V');
          errorDetails.push('Oplossing: converteer de video naar MP4');
        } else if (err.message.includes('duur') || err.message.includes('duration')) {
          errorMessage = '⏱️ Video te lang';
          errorDetails.push(err.message);
          errorDetails.push('Maximum toegestaan: 30 seconden');
          errorDetails.push('Oplossing: verkort de video of gebruik een kortere clip');
        } else if (err.message.includes('network') || err.message.includes('fetch') || err.name === 'TypeError') {
          errorMessage = '🌐 Netwerkfout';
          errorDetails.push('Kon geen verbinding maken met de server');
          errorDetails.push('Mogelijke oorzaken:');
          errorDetails.push('  • Geen internetverbinding');
          errorDetails.push('  • Firewall blokkeert de verbinding');
          errorDetails.push('  • Server is tijdelijk niet bereikbaar');
          errorDetails.push('Oplossing: controleer je internetverbinding en probeer het opnieuw');
        } else if (err.message.includes('aborted') || err.name === 'AbortError') {
          errorMessage = '❌ Upload geannuleerd';
          errorDetails.push('De upload is geannuleerd of afgebroken');
          errorDetails.push('Mogelijke oorzaken: timeout, gebruiker heeft geannuleerd, of netwerkproblemen');
          errorDetails.push('Oplossing: probeer het opnieuw met een kleiner bestand');
        } else if (err.message.includes('metadata') || err.message.includes('codec') || err.message.includes('HEVC') || err.message.includes('H.265')) {
          const isHEVC = isLikelyHEVCVideo(file);
          if (isHEVC) {
            errorMessage = '🎬 HEVC/H.265 video codec';
            errorDetails.push('Je video gebruikt HEVC (H.265) codec');
            errorDetails.push('Dit is een moderne codec die niet door alle browsers wordt ondersteund voor validatie');
            errorDetails.push('');
            errorDetails.push('✅ Goed nieuws: Je video wordt WEL geaccepteerd!');
            errorDetails.push('De browser kan de metadata niet lezen, maar de video zelf is geldig');
            errorDetails.push('');
            errorDetails.push('💡 Tips:');
            errorDetails.push('  • Upload wordt toegestaan zonder duration check');
            errorDetails.push('  • Zorg dat je video onder 30 seconden is');
            errorDetails.push('  • Voor betere compatibiliteit: converteer naar MP4 (H.264)');
          } else {
            errorMessage = '🎬 Video metadata probleem';
            errorDetails.push('Kon video metadata niet lezen');
            errorDetails.push('Mogelijke oorzaken:');
            errorDetails.push('  • Video is bewerkt of gecomprimeerd');
            errorDetails.push('  • Codec wordt niet ondersteund door browser');
            errorDetails.push('  • Video bestand is beschadigd');
            errorDetails.push('Oplossing: exporteer de video opnieuw als MP4 (H.264 codec)');
          }
        } else if (err.message.includes('response') || err.message.includes('server')) {
          errorMessage = '🔴 Serverfout';
          errorDetails.push(`Server melding: ${err.message}`);
          errorDetails.push('Mogelijke oorzaken: serverproblemen, bestand te groot, of ongeldig formaat');
          errorDetails.push('Oplossing: probeer het later opnieuw of neem contact op met support');
        } else {
          // Generic error - show full details
          errorMessage = '❌ Upload mislukt';
          errorDetails.push(`Foutmelding: ${err.message}`);
          errorDetails.push(`Fouttype: ${err.name || 'onbekend'}`);
        }
      } else {
        errorMessage = '❌ Onbekende fout';
        errorDetails.push('Er is een onbekende fout opgetreden tijdens het uploaden');
        errorDetails.push(`Fouttype: ${err.name || 'onbekend'}`);
      }
      
      // Add file information
      if (file) {
        errorDetails.push('');
        errorDetails.push('📄 Bestandsinformatie:');
        errorDetails.push(`  • Naam: ${file.name}`);
        errorDetails.push(`  • Grootte: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
        errorDetails.push(`  • Type: ${file.type || 'onbekend'}`);
        errorDetails.push(`  • Laatst gewijzigd: ${new Date(file.lastModified).toLocaleString('nl-NL')}`);
      }
      
      // Add browser information with proper detection
      if (typeof navigator !== 'undefined') {
        const userAgent = navigator.userAgent.toLowerCase();
        let browserName = 'Onbekend';
        let browserVersion = '';
        
        // Proper browser detection
        if (userAgent.includes('edg')) {
          browserName = 'Microsoft Edge';
          const match = userAgent.match(/edg\/([\d.]+)/);
          browserVersion = match ? match[1] : '';
        } else if (userAgent.includes('chrome') && navigator.vendor?.toLowerCase().includes('google')) {
          browserName = 'Google Chrome';
          const match = userAgent.match(/chrome\/([\d.]+)/);
          browserVersion = match ? match[1] : '';
        } else if (userAgent.includes('firefox')) {
          browserName = 'Mozilla Firefox';
          const match = userAgent.match(/firefox\/([\d.]+)/);
          browserVersion = match ? match[1] : '';
        } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
          browserName = 'Safari';
          const match = userAgent.match(/version\/([\d.]+)/);
          browserVersion = match ? match[1] : '';
        } else if (userAgent.includes('samsungbrowser')) {
          browserName = 'Samsung Internet';
          const match = userAgent.match(/samsungbrowser\/([\d.]+)/);
          browserVersion = match ? match[1] : '';
        } else if (userAgent.includes('opera') || userAgent.includes('opr')) {
          browserName = 'Opera';
          const match = userAgent.match(/(?:opera|opr)\/([\d.]+)/);
          browserVersion = match ? match[1] : '';
        }
        
        errorDetails.push('');
        errorDetails.push('🌐 Browser informatie:');
        errorDetails.push(`  • Browser: ${browserName}${browserVersion ? ` ${browserVersion}` : ''}`);
        errorDetails.push(`  • Platform: ${navigator.platform || 'onbekend'}`);
        errorDetails.push(`  • User Agent: ${navigator.userAgent.substring(0, 80)}...`);
      }
      
      // Add troubleshooting tips
      if (file) {
        errorDetails.push('');
        errorDetails.push('💡 Tips om het probleem op te lossen:');
        if (file.size > 30 * 1024 * 1024) {
          errorDetails.push('  • Bestand is groot - probeer de video te comprimeren');
        }
        if (!file.type || file.type === '') {
          errorDetails.push('  • Bestandstype ontbreekt - exporteer de video opnieuw als MP4');
        }
        if (file.type && !file.type.includes('mp4') && !file.type.includes('webm')) {
          errorDetails.push(`  • Formaat ${file.type} - converteer naar MP4 voor beste compatibiliteit`);
        }
        errorDetails.push('  • Probeer een andere browser (Chrome, Firefox, Safari)');
        errorDetails.push('  • Controleer je internetverbinding');
        errorDetails.push('  • Probeer het later opnieuw als het een serverprobleem lijkt');
      }
      
      // Combine error message and details
      const fullErrorMessage = `${errorMessage}\n\n${errorDetails.join('\n')}`;
      
      setError(fullErrorMessage);
    } finally {
      clearTimeout(timeoutId);
      setUploading(false);
      setCompressing(false);
      setCompressionProgress(0);
      onUploadEnd?.();
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Ensure scroll container is still functional after upload/compression
      // Simple, conservative approach that works for all browsers
      const restoreScroll = () => {
        // Find all scroll containers in forms
        const scrollContainers = document.querySelectorAll('[data-recipe-form], [data-garden-form], [data-design-form], [data-quickadd-form], [data-edit-product-form], [data-compact-chef-form], [data-compact-garden-form], [data-compact-designer-form]');
        
        scrollContainers.forEach((container) => {
          const el = container as HTMLElement;
          if (!el) return;
          
          // Only ensure basic scroll properties are set - don't change DOM structure
          // This works for all browsers including Chrome
          if (el.scrollHeight > el.clientHeight) {
            // Ensure overflow is set correctly
            const computedStyle = window.getComputedStyle(el);
            if (computedStyle.overflowY !== 'auto' && computedStyle.overflowY !== 'scroll') {
              el.style.overflowY = 'auto';
            }
            el.style.overflowX = 'hidden';
            el.style.touchAction = 'pan-y';
            
            // Browser-specific touch scrolling support
            if ('ontouchstart' in window) {
              (el.style as any).WebkitOverflowScrolling = 'touch';
            }
            
            // Force a reflow to ensure Chrome recognizes the scroll container
            void el.offsetHeight;
            
            // For Chrome: trigger a tiny scroll movement to activate scrolling
            const userAgent = navigator.userAgent.toLowerCase();
            const isChrome = /chrome/.test(userAgent) && !/edg|opr/.test(userAgent);
            const isEdge = /edg/.test(userAgent);
            
            if ((isChrome || isEdge) && el.scrollHeight > el.clientHeight) {
              // Small scroll activation for Chrome
              const currentScroll = el.scrollTop;
              requestAnimationFrame(() => {
                el.scrollTop = currentScroll + 0.1;
                requestAnimationFrame(() => {
                  el.scrollTop = currentScroll;
                });
              });
            }
          }
        });
        
        // Ensure body doesn't block scrolling
        if (document.body) {
          const bodyStyle = window.getComputedStyle(document.body);
          if (bodyStyle.overflow === 'hidden') {
            document.body.style.overflow = '';
          }
        }
      };
      
      // Restore immediately and after delays to ensure it works
      restoreScroll();
      setTimeout(restoreScroll, 50);
      setTimeout(restoreScroll, 200);
      setTimeout(restoreScroll, 500);
      setTimeout(restoreScroll, 1000);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setThumbnail(null);
    setError(null);
    onChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Video (optioneel)
      </label>
      <p className="text-xs text-gray-500 mb-2">
        Maximaal {maxDuration} seconden, maximaal 50MB. Ondersteunde formaten: MP4, WebM, MOV, AVI, 3GP, MKV, M4V.
      </p>

      {preview ? (
        <div className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          <div className="aspect-video relative">
            <video
              ref={(el) => {
                if (el) {
                  // Start muted for autoplay compliance, but allow user to unmute via controls
                  el.muted = true;
                }
              }}
              src={preview}
              className="w-full h-full object-cover"
              controls
              playsInline
              preload="metadata"
              // Don't hardcode muted attribute - let controls handle it
              // Video starts muted via ref, but user can unmute via browser controls
              onError={(e) => {
                // HEVC/H.265 videos often can't be previewed in browser
                // This is normal and doesn't mean the upload failed
                console.warn('Video preview error (normal for HEVC videos):', e);
                const video = e.currentTarget;
                if (video.error) {
                  console.warn('Video error code:', video.error.code, 'Message:', video.error.message);
                }
              }}
            >
              Je browser ondersteunt geen video element.
            </video>
            {value?.duration && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10">
                {Math.ceil(value.duration)}s
              </div>
            )}
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-100 hover:bg-red-600 z-10 shadow-lg flex items-center gap-1.5"
              title="Video verwijderen"
            >
              <X className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">Verwijderen</span>
            </button>
          )}
          <div className="p-2 text-xs text-gray-600 flex items-center justify-between">
            <span>
              Video geüpload
              {value?.duration && ` • ${Math.ceil(value.duration)} seconden`}
            </span>
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="text-red-600 hover:text-red-700 font-medium underline sm:hidden"
              >
                Verwijderen
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${disabled || uploading
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 bg-white hover:border-emerald-400 hover:bg-emerald-50'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,.mp4,.m4v,.mov,.webm,.avi,.3gp,.3g2,.3gpp,.mkv,.ogv,.ogg,.flv,.wmv,.asf,.asx,.rm,.rmvb,.vob,.ts,.mts,.m2ts,.mxf,.divx,.xvid,.f4v,.mpg,.mpeg,.m2v,.mpv,.qt,.dv,.amv"
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="hidden"
          />
          
          {uploading || compressing ? (
            <div className="space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              </div>
              {compressing ? (
                <>
                  <p className="text-sm text-gray-600">Video wordt gecomprimeerd...</p>
                  {compressionProgress > 0 && (
                    <div className="w-full max-w-xs mx-auto">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${compressionProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{compressionProgress}%</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-600">Video wordt geüpload...</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 text-gray-400 mx-auto" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Klik om video te uploaden
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Max {maxDuration}s • Max 50MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-300 rounded-lg text-sm text-red-800">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-red-900 mb-2 text-base">{error.split('\n')[0]}</p>
            <div className="text-xs text-red-700 whitespace-pre-line leading-relaxed font-mono bg-red-100 p-3 rounded border border-red-200 overflow-auto max-h-96">
              {error.split('\n').slice(1).join('\n')}
            </div>
            {process.env.NODE_ENV === 'development' && fileInputRef.current?.files?.[0] && (
              <details className="mt-3 text-xs text-red-600">
                <summary className="cursor-pointer hover:text-red-800 font-medium">🔧 Technische details (development mode)</summary>
                <pre className="mt-2 p-3 bg-red-100 rounded text-xs overflow-auto max-h-60 border border-red-200">
                  {JSON.stringify({
                    fileName: fileInputRef.current.files[0].name,
                    fileSize: fileInputRef.current.files[0].size,
                    fileType: fileInputRef.current.files[0].type,
                    lastModified: new Date(fileInputRef.current.files[0].lastModified).toISOString(),
                    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
                    platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
                    vendor: typeof navigator !== 'undefined' ? navigator.vendor : 'unknown',
                    timestamp: new Date().toISOString()
                  }, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      )}

      {preview && !error && (
        <div className="flex items-center gap-2 text-xs text-emerald-600">
          <CheckCircle className="w-4 h-4" />
          <span>Video succesvol geüpload</span>
        </div>
      )}
    </div>
  );
}

