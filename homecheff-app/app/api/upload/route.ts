import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.S3_REGION!;
const bucket = process.env.S3_BUCKET!;
const accessKeyId = process.env.S3_ACCESS_KEY_ID!;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY!;

const s3 = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });

export async function POST(req: Request) {
  try {
    const { filename, type } = await req.json();
    if (!filename || !type) {
      return NextResponse.json({ error: "filename en type verplicht" }, { status: 400 });
    }
    const key = `uploads/${Date.now()}-${filename}`;
    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: type });
    const url = await getSignedUrl(s3, command, { expiresIn: 60 });
    const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    return NextResponse.json({ url, key, publicUrl });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Upload presign mislukt" }, { status: 500 });
  }
}
