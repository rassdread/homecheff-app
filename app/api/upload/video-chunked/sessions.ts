// Shared upload sessions storage for chunked uploads
// In production, use Redis or similar for persistence across serverless functions

export interface UploadSession {
  fileName: string;
  fileType: string;
  fileSize: number;
  totalChunks: number;
  chunks: Map<number, Buffer>;
  createdAt: number;
}

export const uploadSessions = new Map<string, UploadSession>();

// Cleanup old sessions (older than 1 hour)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [id, session] of uploadSessions.entries()) {
      if (session.createdAt < oneHourAgo) {
        uploadSessions.delete(id);
        console.log(`🧹 Cleaned up expired upload session: ${id}`);
      }
    }
  }, 5 * 60 * 1000); // Run every 5 minutes
}








