
-- Create gallery_items table
CREATE TABLE public.gallery_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'video')),
  url text NOT NULL,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'All',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Gallery items are viewable by everyone"
  ON public.gallery_items FOR SELECT
  USING (true);

-- Admin-only insert
CREATE POLICY "Admins can insert gallery items"
  ON public.gallery_items FOR INSERT
  WITH CHECK (is_admin());

-- Admin-only update
CREATE POLICY "Admins can update gallery items"
  ON public.gallery_items FOR UPDATE
  USING (is_admin());

-- Admin-only delete
CREATE POLICY "Admins can delete gallery items"
  ON public.gallery_items FOR DELETE
  USING (is_admin());

-- Create gallery_media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery_media', 'gallery_media', true);

-- Storage policies for gallery_media
CREATE POLICY "Gallery media is publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery_media');

CREATE POLICY "Admins can upload gallery media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gallery_media' AND public.is_admin());

CREATE POLICY "Admins can delete gallery media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'gallery_media' AND public.is_admin());
