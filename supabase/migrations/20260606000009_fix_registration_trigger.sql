-- ============================================================
-- Phase 1, Migration 9: Fix registration trigger for RPCs
-- Ensures register_free_event RPC (running as SECURITY DEFINER owner)
-- can successfully insert registrations with 'paid' status.
-- Direct client inserts (running as 'authenticated' or 'anon')
-- are still restricted to 'pending'.
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_registration_pending_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Check the active PostgreSQL user (CURRENT_USER). 
  -- SECURITY DEFINER functions run under the owner's role (e.g. postgres, supabase_admin),
  -- whereas client REST API queries execute directly as 'authenticated' or 'anon'.
  IF CURRENT_USER IN ('authenticated', 'anon') THEN
    NEW.status := 'pending';
  END IF;
  RETURN NEW;
END;
$$;
