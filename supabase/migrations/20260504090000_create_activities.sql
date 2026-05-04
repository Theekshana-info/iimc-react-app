-- Create activities table
CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text NOT NULL,
  cover_image_url text NOT NULL,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Activities are viewable by everyone"
  ON public.activities FOR SELECT
  USING (true);

-- Admin-only insert
CREATE POLICY "Admins can insert activities"
  ON public.activities FOR INSERT
  WITH CHECK (is_admin());

-- Admin-only update
CREATE POLICY "Admins can update activities"
  ON public.activities FOR UPDATE
  USING (is_admin());

-- Admin-only delete
CREATE POLICY "Admins can delete activities"
  ON public.activities FOR DELETE
  USING (is_admin());

CREATE INDEX activities_created_at_idx ON public.activities (created_at DESC);
