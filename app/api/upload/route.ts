import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export const runtime = "nodejs";

// Increase body size limit for video uploads (up to 50MB)
export const maxDuration = 60; // 60 seconds timeout

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string || "general";
    
    console.log('📥 Upload request received:', {
      fileName: file?.name,
      fileSize: file ? `${(file.size / (1024 * 1024)).toFixed(2)}MB` : 'N/A',
      fileType: file?.type,
      type: type
    });
    
    if (!file || !(file instanceof File)) {
      const isFile = file && typeof file === 'object' && 'name' in file && 'size' in file;
      console.error('❌ Invalid file received:', { file, isFile });
      return NextResponse.json({ error: "Geen geldig bestand ontvangen" }, { status: 400 });
    }

    // Convert file to buffer
    let arrayBuffer: ArrayBuffer;
    let buffer: Buffer;
    try {
      arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      console.log('✅ File converted to buffer:', {
        bufferSize: `${(buffer.length / (1024 * 1024)).toFixed(2)}MB`
      });
    } catch (bufferError: any) {
      console.error('❌ Failed to convert file to buffer:', bufferError);
      return NextResponse.json({ 
        error: `Fout bij verwerken van bestand: ${bufferError.message || 'onbekende fout'}` 
      }, { status: 400 });
    }
    
    // Enhanced file validation for images and videos
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (isImage) {
      // Check file format
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        return NextResponse.json({ 
          error: "Alleen JPG, PNG, WebP en GIF bestanden zijn toegestaan." 
        }, { status: 400 });
      }
      
      // Check file size - increased to 50MB because client-side compression is applied
      // The client will compress images before upload, so we can accept larger originals
      // Most photos are under 25MB, so 50MB is a safe upper limit
      const maxSize = 50 * 1024 * 1024; // 50MB limit (after client compression, should be much smaller)
      if (buffer.length > maxSize) {
        return NextResponse.json({ 
          error: "Foto is te groot. Probeer een kleinere foto." 
        }, { status: 400 });
      }
    } else if (isVideo) {
      // Check video format - comprehensive list for maximum compatibility
      // Includes formats from various phones, apps, and platforms
      // Based on common formats used by: Snapchat, TikTok, Instagram, WhatsApp, iOS, Android, etc.
      const allowedVideoTypes = [
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
        'video/vnd.vivo', // Vivo
        'video/vnd.mpegurl', // M3U8 (HLS)
        'video/x-mpegurl', // M3U8 alternative
      ];
      
      // Allowed video file extensions (as fallback when MIME type is missing or incorrect)
      // Includes extensions from all major platforms and apps
      const allowedVideoExtensions = [
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
        '.mpg', '.mpeg', '.m2v', // MPEG
        '.mpv', // MPEG variant
        '.qt', // QuickTime (alternative)
        '.dv', // Digital Video
        '.amv', // AMV (Chinese format)
      ];
      
      // Normalize file type and name for checking
      const normalizedType = file.type?.toLowerCase() || '';
      const fileName = file.name?.toLowerCase() || '';
      
      // Check if MIME type is allowed
      const hasAllowedMimeType = normalizedType && allowedVideoTypes.includes(normalizedType);
      
      // Check if file extension is allowed (fallback for missing/incorrect MIME types)
      const hasAllowedExtension = allowedVideoExtensions.some(ext => fileName.endsWith(ext));
      
      // Accept if either MIME type OR extension is valid
      // This handles cases where MIME type is missing, incorrect, or changed after editing/compression
      const isAllowedVideo = hasAllowedMimeType || hasAllowedExtension;
      
      // For edited/compressed videos and social media videos, be even more lenient
      // If file starts with video/ prefix, accept it even if not in our list
      // Also check for common video extensions that might not be in our MIME type list
      const commonVideoExtensions = /\.(mp4|m4v|mov|webm|avi|3gp|3g2|3gpp|mkv|ogv|ogg|flv|wmv|asf|asx|rm|rmvb|vob|ts|mts|m2ts|mxf|divx|xvid|f4v|mpg|mpeg|m2v|mpv|qt|dv|amv|bik|nsv)$/i;
      const isVideoLike = normalizedType.startsWith('video/') || commonVideoExtensions.test(fileName);
      
      // Check if it's from a social media app (Snapchat, TikTok, Instagram, etc.)
      const isSocialMediaVideo = /(snapchat|snap|tiktok|instagram|whatsapp|facebook|twitter|telegram|signal|messenger|imessage|iphone|android|camera|dcim|screenshots|screen[-_]recording)/i.test(fileName);
      
      if (!isAllowedVideo && !isVideoLike) {
        console.warn('⚠️ Video format check failed:', {
          normalizedType,
          fileName,
          hasAllowedMimeType,
          hasAllowedExtension,
          isVideoLike,
          isSocialMediaVideo
        });
        return NextResponse.json({ 
          error: `Video formaat niet ondersteund. Toegestane formaten: MP4, WebM, MOV, AVI, 3GP, MKV, M4V, en meer. Jouw bestand: ${normalizedType || 'onbekend type'}${fileName ? ` (${fileName})` : ''}` 
        }, { status: 400 });
      }
      
      // Log if we're accepting a video that doesn't match our strict list (for debugging)
      if (!isAllowedVideo && (isVideoLike || isSocialMediaVideo)) {
        console.warn('⚠️ Accepting video with non-standard format:', {
          normalizedType,
          fileName,
          reason: isSocialMediaVideo ? 'social media video detected' : 'video-like file detected'
        });
      }
      
      // Check file size - 50MB max for videos
      const maxVideoSize = 50 * 1024 * 1024; // 50MB
      if (buffer.length > maxVideoSize) {
        const sizeMB = (buffer.length / (1024 * 1024)).toFixed(1);
        return NextResponse.json({ 
          error: `Video is te groot (${sizeMB}MB). Maximum 50MB toegestaan.` 
        }, { status: 400 });
      }
      
      // Note: Video duration validation is done client-side before upload
      // as we cannot easily check duration server-side without processing the entire video
    } else {
      return NextResponse.json({ 
        error: "Alleen afbeeldingen en video's zijn toegestaan." 
      }, { status: 400 });
    }
    
    // Try Vercel Blob first
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
    let publicUrl: string | null = null;

    if (token) {
      try {
        const { put } = await import("@vercel/blob");
        const key = `uploads/${crypto.randomUUID()}-${file.name}`;

        const blob = await put(key, buffer, {
          access: "public",
          token: token,
          addRandomSuffix: true,
        });
        publicUrl = blob.url;

      } catch (error: any) {
        console.error("❌ Blob upload failed:", {
          error: error,
          message: error?.message,
          code: error?.code,
          statusCode: error?.statusCode
        });
        // Continue to base64 fallback
      }
    } else {

    }
    
    // Fallback: use base64 data URL for development
    if (!publicUrl) {
      try {
        // Warn if using base64 fallback (should only happen in local dev without BLOB token)
        if (!token) {
          console.warn("⚠️ No BLOB_READ_WRITE_TOKEN found, using base64 fallback. For production, set BLOB_READ_WRITE_TOKEN in .env.local");
        }
        
        const base64 = buffer.toString('base64');
        const mimeType = file.type || 'image/jpeg';
        publicUrl = `data:${mimeType};base64,${base64}`;
        
        // Warn if base64 URL is very large (can cause issues)
        if (publicUrl.length > 1 * 1024 * 1024) { // 1MB
          console.warn(`⚠️ Large base64 data URL (${Math.round(publicUrl.length / 1024)}KB). Consider using BLOB_READ_WRITE_TOKEN for better performance.`);
        }

      } catch (e: any) {
        console.error("❌ Base64 conversion failed:", {
          error: e,
          message: e?.message,
          stack: e?.stack
        });
        return NextResponse.json({ 
          error: `Fout bij verwerken van bestand: ${e?.message || 'onbekende fout'}` 
        }, { status: 500 });
      }
    }
    
    if (!publicUrl) {
      console.error('❌ No public URL generated after all attempts');
      return NextResponse.json({ 
        error: "Upload mislukt - kon geen publieke URL genereren. Controleer BLOB_READ_WRITE_TOKEN configuratie." 
      }, { status: 500 });
    }
    
    console.log('✅ Upload successful:', {
      urlLength: publicUrl.length,
      urlType: publicUrl.startsWith('data:') ? 'base64' : 'blob',
      fileName: file.name
    });
    
    return NextResponse.json({ url: publicUrl });
  } catch (e: any) {
    console.error("❌ Upload error:", {
      error: e,
      message: e?.message,
      stack: e?.stack,
      name: e?.name
    });
    
    // Provide more specific error messages
    let errorMessage = "Upload mislukt";
    if (e?.message?.includes('too large') || e?.message?.includes('413') || e?.code === '413') {
      errorMessage = "Bestand is te groot. Maximum 50MB toegestaan.";
    } else if (e?.message?.includes('format') || e?.message?.includes('type') || e?.message?.includes('not supported')) {
      errorMessage = e.message || "Bestandsformaat niet ondersteund.";
    } else if (e?.message?.includes('timeout') || e?.code === 'ETIMEDOUT') {
      errorMessage = "Upload timeout. Probeer het opnieuw met een kleiner bestand.";
    } else if (e?.message) {
      errorMessage = e.message;
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? e?.message : undefined
    }, { status: 500 });
  }
}