-- Backfill existing users from auth.users to public.users
-- This fixes the "Foreign Key Violation" error when creating boards
INSERT INTO public.users (id, email, full_name, avatar_url)
SELECT 
    id, 
    email, 
    raw_user_meta_data->>'full_name', 
    raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
