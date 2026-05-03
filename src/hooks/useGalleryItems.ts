import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  title: string;
  category: string;
  created_at: string;
}

export const GALLERY_CATEGORIES = ['All', 'Meditation Hall', 'Retreats', 'Nature', 'Videos'] as const;
export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number];

export const useGalleryItems = () => {
  return useQuery({
    queryKey: ['gallery-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown as GalleryItem[]) ?? [];
    },
  });
};
