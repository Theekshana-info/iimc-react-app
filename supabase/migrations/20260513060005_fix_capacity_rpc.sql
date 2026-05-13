-- HIGH-2: Fix event capacity race condition
-- The webhook upserts registrations without checking capacity.
-- This RPC atomically locks the event row, checks capacity, then registers.

CREATE OR REPLACE FUNCTION public.create_paid_registration(
  p_event_id UUID,
  p_user_id UUID
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

  -- Count current paid registrations
  SELECT COUNT(*) INTO v_registered
  FROM public.event_registrations
  WHERE event_id = p_event_id AND status = 'paid';

  -- Enforce capacity if set
  IF v_capacity IS NOT NULL AND v_registered >= v_capacity THEN
    RAISE EXCEPTION 'Event is at full capacity';
  END IF;

  -- Upsert the registration as paid (bypasses the trigger since SECURITY DEFINER runs as owner)
  INSERT INTO public.event_registrations (event_id, user_id, status, registered_at)
  VALUES (p_event_id, p_user_id, 'paid', NOW())
  ON CONFLICT (event_id, user_id) DO UPDATE SET status = 'paid', registered_at = NOW();
END;
$$;

-- Only service_role (webhook edge functions) should call this
GRANT EXECUTE ON FUNCTION public.create_paid_registration(UUID, UUID) TO service_role;
