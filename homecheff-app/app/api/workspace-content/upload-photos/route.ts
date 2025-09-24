import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const formData = await req.formData();
    const workspaceContentId = formData.get('workspaceContentId') as string;
    const photos = formData.getAll('photos') as File[];

    if (!workspaceContentId || photos.length === 0) {
      return NextResponse.json({ 
        error: 'Workspace content ID en foto\'s zijn verplicht' 
      }, { status: 400 });
    }

    // Verify user owns this workspace content
    const workspaceContent = await prisma.workspaceContent.findUnique({
      where: { id: workspaceContentId },
      include: {
        sellerProfile: {
          select: { userId: true }
        }
      }
    });

    if (!workspaceContent || workspaceContent.sellerProfile.userId !== (session.user as any).id) {
      return NextResponse.json({ 
        error: 'Geen toegang tot deze content' 
      }, { status: 403 });
    }

    const uploadedPhotos: any[] = [];

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];

      if (!photo.type.startsWith('image/')) {
        return NextResponse.json({ 
          error: 'Alleen afbeeldingen zijn toegestaan' 
        }, { status: 400 });
      }

      if (photo.size > 5 * 1024 * 1024) { // Max 5MB
        return NextResponse.json({ 
          error: 'Foto mag maximaal 5MB zijn' 
        }, { status: 400 });
      }

      const bytes = await photo.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = photo.name.split('.').pop() || 'jpg';
      const filename = `workspace-${workspaceContentId}-${timestamp}-${i}-${randomString}.${extension}`;
      
      const path = join(process.cwd(), 'public', 'uploads', 'workspace', filename);
      await writeFile(path, buffer);

      // Save photo to database
      const savedPhoto = await prisma.workspaceContentPhoto.create({
        data: {
          workspaceContentId,
          fileUrl: `/uploads/workspace/${filename}`,
          sortOrder: i,
          caption: null
        }
      });

      uploadedPhotos.push(savedPhoto);
    }

    return NextResponse.json({ 
      success: true, 
      photos: uploadedPhotos,
      message: 'Foto\'s succesvol geüpload'
    });

  } catch (error) {
    console.error('Workspace content photo upload error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het uploaden van foto\'s' 
    }, { status: 500 });
  }
}
