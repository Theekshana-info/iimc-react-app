-- ============================================================
-- Phase 1, Migration 6: Session generation RPC
-- Populates event_sessions for a recurring event.
-- Called by admin after creating/updating a recurring event.
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_event_sessions(
  p_event_id   uuid,
  p_start_date date,
  p_end_date   date
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recurrence_type text;
  v_recurrence_days jsonb;
  v_event_time      text;
  v_current_date    date;
  v_day_of_week     integer;
  v_count           integer := 0;
BEGIN
  -- Fetch event details
  SELECT recurrence_type, recurrence_days, event_time
  INTO v_recurrence_type, v_recurrence_days, v_event_time
  FROM public.events
  WHERE id = p_event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  -- Validate date range
  IF p_start_date > p_end_date THEN
    RAISE EXCEPTION 'Start date must be before or equal to end date';
  END IF;

  -- For one-time events, create a single session
  IF v_recurrence_type IS NULL OR v_recurrence_type = 'none' THEN
    INSERT INTO public.event_sessions (event_id, session_date, session_time)
    VALUES (p_event_id, p_start_date, v_event_time::time)
    ON CONFLICT (event_id, session_date) DO NOTHING;
    RETURN 1;
  END IF;

  -- For daily events, create a session for every day in the range
  IF v_recurrence_type = 'daily' THEN
    v_current_date := p_start_date;
    WHILE v_current_date <= p_end_date LOOP
      INSERT INTO public.event_sessions (event_id, session_date, session_time)
      VALUES (p_event_id, v_current_date, v_event_time::time)
      ON CONFLICT (event_id, session_date) DO NOTHING;
      v_count := v_count + 1;
      v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;
    RETURN v_count;
  END IF;

  -- For weekly events, create sessions only on matching days
  IF v_recurrence_type = 'weekly' THEN
    v_current_date := p_start_date;
    WHILE v_current_date <= p_end_date LOOP
      -- PostgreSQL EXTRACT(DOW) returns 0=Sunday, 1=Monday, ...
      v_day_of_week := EXTRACT(DOW FROM v_current_date)::integer;

      -- Check if this day is in the recurrence_days array
      IF v_recurrence_days IS NOT NULL AND v_recurrence_days @> to_jsonb(v_day_of_week) THEN
        INSERT INTO public.event_sessions (event_id, session_date, session_time)
        VALUES (p_event_id, v_current_date, v_event_time::time)
        ON CONFLICT (event_id, session_date) DO NOTHING;
        v_count := v_count + 1;
      END IF;

      v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;
    RETURN v_count;
  END IF;

  RETURN v_count;
END;
$$;

-- Admins and service_role can call this
GRANT EXECUTE ON FUNCTION public.generate_event_sessions(uuid, date, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_event_sessions(uuid, date, date) TO authenticated;
