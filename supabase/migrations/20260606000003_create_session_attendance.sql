-- ============================================================
-- Phase 1, Migration 3: session_attendance
-- Tracks user attendance per specific session for admin use.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.session_attendance (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid        NOT NULL REFERENCES public.event_sessions(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      text        NOT NULL DEFAULT 'present'
                          CHECK (status IN ('present', 'absent', 'excused')),
  marked_at   timestamptz NOT NULL DEFAULT now(),
  marked_by   uuid        NULL REFERENCES public.profiles(id),  -- admin who marked

  CONSTRAINT uq_session_attendance UNIQUE (session_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_session ON public.session_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user    ON public.session_attendance(user_id);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.session_attendance ENABLE ROW LEVEL SECURITY;

-- Users can view their own attendance
CREATE POLICY "Users can view own attendance"
  ON public.session_attendance FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can do everything
CREATE POLICY "Admins can manage attendance"
  ON public.session_attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

GRANT ALL ON public.session_attendance TO service_role;
GRANT SELECT ON public.session_attendance TO authenticated;
