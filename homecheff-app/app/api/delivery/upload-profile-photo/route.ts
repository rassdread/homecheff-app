import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const formData = await req.formData();
    const photo = formData.get('photo') as File;

    if (!photo) {
      return NextResponse.json({ 
        error: 'Geen foto geüpload' 
      }, { status: 400 });
    }

    // Validate file type
    if (!photo.type.startsWith('image/')) {
      return NextResponse.json({ 
        error: 'Alleen afbeeldingen zijn toegestaan' 
      }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (photo.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'Foto mag maximaal 10MB zijn' 
      }, { status: 400 });
    }

    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Try Vercel Blob first
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
    let publicUrl: string | null = null;

    if (token) {
      try {
        const { put } = await import("@vercel/blob");
        const key = `delivery-profile-photos/${crypto.randomUUID()}-${photo.name}`;
        const blob = await put(key, buffer, {
          access: "public",
          token: token,
          addRandomSuffix: true,
        });
        publicUrl = blob.url;
        console.log("Delivery profile photo upload successful:", blob.url);
      } catch (error) {
        console.error("Delivery profile photo upload failed:", error);
      }
    }

    // Fallback: use base64 data URL for development
    if (!publicUrl) {
      try {
        const base64 = buffer.toString('base64');
        const mimeType = photo.type || 'image/jpeg';
        publicUrl = `data:${mimeType};base64,${base64}`;
        console.log("Using base64 fallback for delivery profile photo");
      } catch (e: any) {
        console.error("Base64 conversion failed:", e);
        return NextResponse.json({ error: "File processing failed" }, { status: 500 });
      }
    }

    if (!publicUrl) {
      return NextResponse.json({ error: "Upload mislukt" }, { status: 500 });
    }

    // Update user profile photo
    await prisma.user.update({
      where: { id: (session.user as any).id },
      data: {
        image: publicUrl
      }
    });

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      message: 'Profielfoto succesvol geüpload'
    });

  } catch (error) {
    console.error('Delivery profile photo upload error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het uploaden van de profielfoto' 
    }, { status: 500 });
  }
}
