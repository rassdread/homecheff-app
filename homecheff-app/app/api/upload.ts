import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import { FormData, fetch } from "undici";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Gebruik native Blob voor bestand in FormData
// Gebruik de native FormData van Node.js

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error("No Vercel Blob token");
    return res.status(500).json({ error: "No Vercel Blob token" });
  }

  const form = new formidable.IncomingForm();
  form.parse(req, async (err: any, fields: formidable.Fields, files: formidable.Files) => {
    if (err) {
      console.error("Form parse error", err);
      return res.status(400).json({ error: "Form parse error" });
    }
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      console.error("No file uploaded", files);
      return res.status(400).json({ error: "No file uploaded" });
    }

    let username = "onbekend";
    try {
      const session = await getServerSession(authOptions);
      const email = session?.user?.email;
      if (email) {
        const user = await prisma.user.findUnique({ where: { email }, select: { username: true } });
        if (user?.username) username = user.username;
      }
    } catch (e) {
      console.error("Gebruikersnaam ophalen mislukt", e);
    }

    try {
      const fileBuffer = await fs.promises.readFile(file.filepath);
      const fd = new FormData();
      const fileArray = new Uint8Array(fileBuffer);
      const fileName = `${username}_${file.originalFilename || "uploaded-file"}`;
      fd.append(
        "file",
        new Blob([fileArray], { type: file.mimetype || "application/octet-stream" }),
        fileName
      );
      console.log("Upload naar Vercel Blob met naam:", fileName);
      const blobRes = await fetch("https://blob.vercel-storage.com/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });
      if (!blobRes.ok) {
        const errText = await blobRes.text();
        console.error("Upload naar blob mislukt", errText);
        return res.status(500).json({ error: "Upload naar blob mislukt", details: errText });
      }
      const blobData = await blobRes.json() as { url: string };
      console.log("Upload succesvol, url:", blobData.url);
      return res.status(200).json({ publicUrl: blobData.url });
    } catch (e) {
      console.error("Upload error", e);
      return res.status(500).json({ error: "Upload error", details: String(e) });
    }
  });
}
