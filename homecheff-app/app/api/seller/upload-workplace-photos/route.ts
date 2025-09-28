import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("photos") as File[];
    const role = formData.get("role") as string;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Geen bestanden ontvangen" }, { status: 400 });
    }

    if (!role) {
      return NextResponse.json({ error: "Rol is vereist" }, { status: 400 });
    }

    // Get user and seller profile
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { SellerProfile: true }
    });

    if (!user || !user.SellerProfile) {
      return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
    }

    console.log(`Uploading ${files.length} workplace photos for role: ${role}`);

    // Upload files and save to database
    const uploadedPhotos: any[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file || !(file instanceof File)) {
        continue;
      }

      console.log(`Uploading file ${i + 1}/${files.length}: ${file.name}`);

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Try Vercel Blob first
      const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
      let publicUrl: string | null = null;

      if (token) {
        try {
          const { put } = await import("@vercel/blob");
          const key = `workplace-photos/${crypto.randomUUID()}-${file.name}`;
          const blob = await put(key, buffer, {
            access: "public",
            token: token,
            addRandomSuffix: true,
          });
          publicUrl = blob.url;
          console.log(`Blob upload successful for ${file.name}:`, blob.url);
        } catch (error) {
          console.error(`Blob upload failed for ${file.name}:`, error);
        }
      }

      // Fallback: use base64 data URL for development
      if (!publicUrl) {
        try {
          const base64 = buffer.toString('base64');
          const mimeType = file.type || 'image/jpeg';
          publicUrl = `data:${mimeType};base64,${base64}`;
          console.log(`Using base64 fallback for ${file.name}`);
        } catch (e: any) {
          console.error(`Base64 conversion failed for ${file.name}:`, e);
          continue;
        }
      }

      if (publicUrl) {
        // Save to database
        const workplacePhoto = await prisma.workplacePhoto.create({
          data: {
            sellerProfileId: user.SellerProfile.id,
            role: role,
            fileUrl: publicUrl,
            sortOrder: i,
          }
        });

        uploadedPhotos.push(workplacePhoto);
      }
    }

    return NextResponse.json({ 
      success: true, 
      uploaded: uploadedPhotos.length,
      photos: uploadedPhotos 
    });

  } catch (error) {
    console.error("Workplace photo upload error:", error);
    return NextResponse.json({ error: "Upload mislukt" }, { status: 500 });
  }
}