-- Add an index on the event_date column of the events table to optimize date-based queries.
CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events (event_date);
