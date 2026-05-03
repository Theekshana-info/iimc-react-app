import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GalleryImage {
  id: string;
  alt: string;
  src: string;
  placeholder?: string | null;
  width: number;
  height: number;
  tags: string[];
  date: string;
  photographer?: string | null;
  license?: string | null;
  is_featured: boolean;
  display_order: number;
}

interface UseGalleryOptions {
  searchQuery?: string;
  selectedTags?: string[];
  sortBy?: 'newest' | 'oldest' | 'name';
  pageSize?: number;
}

export const useGallery = (options: UseGalleryOptions = {}) => {
  const { searchQuery = '', selectedTags = [], sortBy = 'newest', pageSize = 20 } = options;
  
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch all unique tags
  useEffect(() => {
    const fetchTags = async () => {
      const { data } = await supabase
        .from('gallery_images')
        .select('tags');
      
      if (data) {
        const uniqueTags = [...new Set(data.flatMap(img => img.tags || []))];
        setAllTags(uniqueTags.sort());
      }
    };
    
    fetchTags();
  }, []);

  // Fetch images
  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      
      let query = supabase
        .from('gallery_images')
        .select('*')
        .range((page - 1) * pageSize, page * pageSize - 1);

      // Apply sorting
      if (sortBy === 'newest') {
        query = query.order('date', { ascending: false });
      } else if (sortBy === 'oldest') {
        query = query.order('date', { ascending: true });
      } else if (sortBy === 'name') {
        query = query.order('alt', { ascending: true });
      }

      const { data, error } = await query;

      if (error) {
        toast.error('Failed to load gallery images');
        setLoading(false);
        return;
      }

      if (data) {
        setImages(prev => page === 1 ? data : [...prev, ...data]);
        setHasMore(data.length === pageSize);
      }
      
      setLoading(false);
    };

    fetchImages();
  }, [page, sortBy, pageSize]);

  // Filter images client-side
  const filteredImages = useMemo(() => {
    let filtered = images;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(img => 
        img.alt.toLowerCase().includes(query) ||
        img.tags.some(tag => tag.toLowerCase().includes(query)) ||
        img.photographer?.toLowerCase().includes(query)
      );
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(img =>
        selectedTags.some(tag => img.tags.includes(tag))
      );
    }

    return filtered;
  }, [images, searchQuery, selectedTags]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const reset = () => {
    setPage(1);
    setImages([]);
    setHasMore(true);
  };

  return {
    images: filteredImages,
    allTags,
    loading,
    hasMore,
    loadMore,
    reset,
  };
};
