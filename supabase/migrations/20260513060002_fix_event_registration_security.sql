-- CRITICAL-1: Fix RLS bypass allowing free registration for paid events
-- Users could directly INSERT with status='paid' bypassing payment.
-- Fix: trigger forces status='pending' on client inserts; RPC for free events.

-- ═══════════════════════════════════════
-- TRIGGER: Force status='pending' on client INSERTs
-- Only service_role (webhook) can set status='paid'
-- ═══════════════════════════════════════
CREATE OR REPLACE FUNCTION public.enforce_registration_pending_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_setting('role') != 'service_role' THEN
    NEW.status := 'pending';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_registration_status_on_insert
  BEFORE INSERT ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.enforce_registration_pending_status();

-- ═══════════════════════════════════════
-- RPC: Secure free event registration
-- Verifies event is actually free + checks capacity atomically
-- ═══════════════════════════════════════
CREATE OR REPLACE FUNCTION public.register_free_event(p_event_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

  -- Check capacity if set
  IF v_capacity IS NOT NULL THEN
    SELECT COUNT(*) INTO v_registered
    FROM public.event_registrations
    WHERE event_id = p_event_id AND status = 'paid';

    IF v_registered >= v_capacity THEN
      RAISE EXCEPTION 'Event is at full capacity';
    END IF;
  END IF;

  -- Insert with status = 'paid' (allowed because function is SECURITY DEFINER)
  INSERT INTO public.event_registrations (event_id, user_id, status)
  VALUES (p_event_id, auth.uid(), 'paid')
  ON CONFLICT (event_id, user_id) DO UPDATE SET status = 'paid';
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_free_event(UUID) TO authenticated;
