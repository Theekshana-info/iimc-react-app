-- ============================================================
-- Phase 1, Migration 10: Drop overloaded old registration RPCs
-- The new RPCs introduced in 20260606000007 use a different signature
-- (with p_session_id UUID DEFAULT NULL). Because of PostgreSQL overloading,
-- the original functions were not replaced but remained alongside the new ones.
-- When the client calls `register_free_event` with just `p_event_id`,
-- PostgREST exact-matches the OLD function, which has the outdated 
-- ON CONFLICT constraint causing registration failures.
-- ============================================================

-- Drop the old exact-match functions so PostgREST will use the new ones with DEFAULTs
DROP FUNCTION IF EXISTS public.register_free_event(UUID);
DROP FUNCTION IF EXISTS public.create_paid_registration(UUID, UUID);
