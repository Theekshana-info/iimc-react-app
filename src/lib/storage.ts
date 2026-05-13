// HIGH-6: Signed URL utility for private storage bucket
import { supabase } from '@/integrations/supabase/client';

const SIGNED_URL_EXPIRY = 60 * 60; // 1 hour

export async function getSignedImageUrl(publicUrl: string): Promise<string> {
  if (!publicUrl) return '';
  // Extract the storage path from a Supabase storage URL
  const match = publicUrl.match(/\/storage\/v1\/object\/(?:public\/|sign\/)?(.+?)(?:\?.*)?$/);
  if (!match) return publicUrl; // not a supabase storage URL, return as-is
  const fullPath = match[1]; // e.g. "admin-uploads/events/1234.jpg"
  const bucketEndIndex = fullPath.indexOf('/');
  if (bucketEndIndex === -1) return publicUrl;
  const bucket = fullPath.substring(0, bucketEndIndex);
  const path = fullPath.substring(bucketEndIndex + 1);
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_URL_EXPIRY);
  if (error || !data) {
    console.error('Failed to create signed URL:', error);
    return '';
  }
  return data.signedUrl;
}
