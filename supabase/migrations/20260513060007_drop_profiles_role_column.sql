-- LOW-1: Remove stale 'role' column from profiles table
-- The app uses the separate user_roles table for role management.
-- This column is unused and creates confusion.

ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;
