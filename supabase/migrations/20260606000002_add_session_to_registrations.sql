-- ============================================================
-- Phase 1, Migration 2: Add session_id to event_registrations
-- Enables per-session registration for recurring events.
-- ============================================================

-- Add nullable FK to event_sessions
ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.event_sessions(id) ON DELETE SET NULL;

-- Drop the old unique constraint (event_id, user_id) so users can register
-- for multiple sessions of the same event.
-- The old constraint was created in the initial migration — we need to find its name.
-- We use a DO block so this is idempotent.
DO $$
BEGIN
  -- Try dropping the common constraint names
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'event_registrations_event_id_user_id_key'
      AND conrelid = 'public.event_registrations'::regclass
  ) THEN
    ALTER TABLE public.event_registrations
      DROP CONSTRAINT event_registrations_event_id_user_id_key;
  END IF;

  -- Also try the alternate naming convention
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_event_user'
      AND conrelid = 'public.event_registrations'::regclass
  ) THEN
    ALTER TABLE public.event_registrations
      DROP CONSTRAINT unique_event_user;
  END IF;
END $$;

-- Create the new composite unique constraint that includes session_id.
-- COALESCE allows NULL session_id to still enforce uniqueness for non-session registrations.
-- We use a unique index with COALESCE instead of a constraint for NULL handling.
CREATE UNIQUE INDEX IF NOT EXISTS uq_registration_event_user_session
  ON public.event_registrations (user_id, event_id, COALESCE(session_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Add a payment_id column to link registrations to their payment record
ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL;

-- Index for session-based queries
CREATE INDEX IF NOT EXISTS idx_registrations_session_id
  ON public.event_registrations(session_id);
