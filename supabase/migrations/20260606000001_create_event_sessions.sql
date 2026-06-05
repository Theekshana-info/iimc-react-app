-- ============================================================
-- Phase 1, Migration 1: event_sessions
-- Tracks individual occurrences of daily/weekly recurring events.
-- One-time events also get a single auto-generated session row.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.event_sessions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid        NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  session_date  date        NOT NULL,
  session_time  time        NULL,
  capacity_override integer NULL,  -- NULL = use parent event's capacity
  status        text        NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'cancelled', 'rescheduled')),
  replaced_by_session_id uuid NULL REFERENCES public.event_sessions(id),
  created_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_event_session_date UNIQUE (event_id, session_date)
);

-- Index for fast look-ups by event
CREATE INDEX IF NOT EXISTS idx_event_sessions_event_id ON public.event_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_sessions_date     ON public.event_sessions(session_date);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.event_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can read sessions (they're public event data)
CREATE POLICY "Anyone can view event sessions"
  ON public.event_sessions FOR SELECT
  USING (true);

-- Only admins can insert/update/delete sessions
CREATE POLICY "Admins can manage event sessions"
  ON public.event_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Service role needs full access for RPC / edge functions
GRANT ALL ON public.event_sessions TO service_role;
GRANT SELECT ON public.event_sessions TO authenticated;
GRANT SELECT ON public.event_sessions TO anon;
