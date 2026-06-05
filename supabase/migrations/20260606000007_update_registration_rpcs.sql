-- ============================================================
-- Phase 1, Migration 7: Update registration RPCs
-- Adds session_id support to create_paid_registration and
-- register_free_event. Both are backward compatible.
-- ============================================================

-- ═══════════════════════════════════════
-- Updated: create_paid_registration
-- Now accepts optional session_id for per-session registration.
-- Uses session capacity_override if available, else event capacity.
-- ═══════════════════════════════════════
CREATE OR REPLACE FUNCTION public.create_paid_registration(
  p_event_id   UUID,
  p_user_id    UUID,
  p_session_id UUID DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_capacity INTEGER;
  v_registered INTEGER;
BEGIN
  -- Lock the event row to prevent race conditions
  SELECT capacity INTO v_capacity FROM public.events WHERE id = p_event_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  -- If session-based, check session capacity override
  IF p_session_id IS NOT NULL THEN
    DECLARE
      v_session_capacity INTEGER;
      v_session_status text;
    BEGIN
      SELECT capacity_override, status
      INTO v_session_capacity, v_session_status
      FROM public.event_sessions
      WHERE id = p_session_id AND event_id = p_event_id
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Session not found for this event';
      END IF;

      IF v_session_status != 'active' THEN
        RAISE EXCEPTION 'Session is not active (status: %)', v_session_status;
      END IF;

      -- Use session-specific capacity if set, else fall back to event capacity
      IF v_session_capacity IS NOT NULL THEN
        v_capacity := v_session_capacity;
      END IF;

      -- Count registrations for THIS specific session
      SELECT COUNT(*) INTO v_registered
      FROM public.event_registrations
      WHERE event_id = p_event_id
        AND session_id = p_session_id
        AND status = 'paid';
    END;
  ELSE
    -- Non-session registration: count all registrations for the event (no session)
    SELECT COUNT(*) INTO v_registered
    FROM public.event_registrations
    WHERE event_id = p_event_id
      AND session_id IS NULL
      AND status = 'paid';
  END IF;

  -- Enforce capacity if set
  IF v_capacity IS NOT NULL AND v_registered >= v_capacity THEN
    RAISE EXCEPTION 'Event is at full capacity';
  END IF;

  -- Upsert the registration as paid
  INSERT INTO public.event_registrations (event_id, user_id, session_id, status, registered_at)
  VALUES (p_event_id, p_user_id, p_session_id, 'paid', NOW())
  ON CONFLICT (user_id, event_id, COALESCE(session_id, '00000000-0000-0000-0000-000000000000'::uuid))
  DO UPDATE SET status = 'paid', registered_at = NOW();
END;
$$;

-- Grant to service_role only (webhook edge functions)
GRANT EXECUTE ON FUNCTION public.create_paid_registration(UUID, UUID, UUID) TO service_role;


-- ═══════════════════════════════════════
-- Updated: register_free_event
-- Now accepts optional session_id for per-session free registration.
-- ═══════════════════════════════════════
CREATE OR REPLACE FUNCTION public.register_free_event(
  p_event_id   UUID,
  p_session_id UUID DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_event_price NUMERIC;
  v_capacity INTEGER;
  v_registered INTEGER;
BEGIN
  -- Verify the event exists and is actually free
  SELECT price, capacity INTO v_event_price, v_capacity
  FROM public.events WHERE id = p_event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  IF v_event_price IS NOT NULL AND v_event_price > 0 THEN
    RAISE EXCEPTION 'This event is not free';
  END IF;

  -- If session-based, validate and check capacity
  IF p_session_id IS NOT NULL THEN
    DECLARE
      v_session_capacity INTEGER;
      v_session_status text;
    BEGIN
      SELECT capacity_override, status
      INTO v_session_capacity, v_session_status
      FROM public.event_sessions
      WHERE id = p_session_id AND event_id = p_event_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Session not found for this event';
      END IF;

      IF v_session_status != 'active' THEN
        RAISE EXCEPTION 'Session is not active';
      END IF;

      IF v_session_capacity IS NOT NULL THEN
        v_capacity := v_session_capacity;
      END IF;

      SELECT COUNT(*) INTO v_registered
      FROM public.event_registrations
      WHERE event_id = p_event_id
        AND session_id = p_session_id
        AND status = 'paid';
    END;
  ELSE
    -- Non-session: check overall capacity
    IF v_capacity IS NOT NULL THEN
      SELECT COUNT(*) INTO v_registered
      FROM public.event_registrations
      WHERE event_id = p_event_id
        AND session_id IS NULL
        AND status = 'paid';

      IF v_registered >= v_capacity THEN
        RAISE EXCEPTION 'Event is at full capacity';
      END IF;
    END IF;
  END IF;

  -- Enforce capacity for session-based
  IF p_session_id IS NOT NULL AND v_capacity IS NOT NULL AND v_registered >= v_capacity THEN
    RAISE EXCEPTION 'Session is at full capacity';
  END IF;

  -- Insert with status = 'paid' (allowed because function is SECURITY DEFINER)
  INSERT INTO public.event_registrations (event_id, user_id, session_id, status)
  VALUES (p_event_id, auth.uid(), p_session_id, 'paid')
  ON CONFLICT (user_id, event_id, COALESCE(session_id, '00000000-0000-0000-0000-000000000000'::uuid))
  DO UPDATE SET status = 'paid';
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_free_event(UUID, UUID) TO authenticated;
