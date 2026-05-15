-- Migration: drop_debug_payment_function
-- Date: 2026-06-01
-- Purpose: Remove insecure debug payment attempts function
-- Related issues: SECURITY S1

DROP FUNCTION IF EXISTS public.get_debug_payment_attempts();
