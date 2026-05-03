ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS event_time TEXT,
ADD COLUMN IF NOT EXISTS recurrence_type TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS recurrence_days JSONB DEFAULT '[]'::jsonb;
