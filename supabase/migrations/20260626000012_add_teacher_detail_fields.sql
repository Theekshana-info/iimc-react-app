-- Add details fields to teachers table to support custom details per guide
ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS quote TEXT,
ADD COLUMN IF NOT EXISTS specialized_fields TEXT,
ADD COLUMN IF NOT EXISTS guided_retreats TEXT;
