-- Re-grant SELECT to anon so that INSERT ... RETURNING * works
-- Row Level Security (RLS) will still prevent anon from reading existing records
GRANT SELECT ON public.donations TO anon;
