-- HIGH-4: Fix donations INSERT allowing arbitrary status from client
-- Client could set status='completed' polluting admin financial reports.
-- Fix: trigger forces status='pending' and clears payment_id on client inserts.

CREATE OR REPLACE FUNCTION public.enforce_donation_pending_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_setting('role') != 'service_role' THEN
    NEW.status := 'pending';
    NEW.payment_id := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_donation_status_on_insert
  BEFORE INSERT ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.enforce_donation_pending_status();
