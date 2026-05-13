// MEDIUM-5: Shared MIME-to-extension map for file uploads
// Never derive file extension from untrusted filenames

export const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

export function getExtensionFromMime(mimeType: string): string | null {
  return MIME_TO_EXT[mimeType] || null;
}
