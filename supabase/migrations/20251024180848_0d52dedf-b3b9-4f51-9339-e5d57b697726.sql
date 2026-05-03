-- First add role column to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
  END IF;
END $$;

-- Create gallery_images table
CREATE TABLE public.gallery_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alt TEXT NOT NULL,
  src TEXT NOT NULL,
  placeholder TEXT,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  tags TEXT[] DEFAULT '{}',
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  photographer TEXT,
  license TEXT,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Everyone can view gallery images
CREATE POLICY "Gallery images are viewable by everyone"
ON public.gallery_images
FOR SELECT
USING (true);

-- Only admins can manage gallery images
CREATE POLICY "Admins can insert gallery images"
ON public.gallery_images
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update gallery images"
ON public.gallery_images
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete gallery images"
ON public.gallery_images
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Create index for faster queries
CREATE INDEX idx_gallery_images_tags ON public.gallery_images USING GIN(tags);
CREATE INDEX idx_gallery_images_date ON public.gallery_images(date DESC);
CREATE INDEX idx_gallery_images_featured ON public.gallery_images(is_featured) WHERE is_featured = true;