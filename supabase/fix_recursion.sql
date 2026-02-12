-- Fix Infinite Recursion by using SECURITY DEFINER functions to bypass RLS loops

-- 1. Helper to get board owner without triggering RLS
CREATE OR REPLACE FUNCTION public.get_board_owner_id(board_uuid UUID)
RETURNS UUID AS $$
DECLARE
  owner_uuid UUID;
BEGIN
  SELECT owner_id INTO owner_uuid FROM public.boards WHERE id = board_uuid;
  RETURN owner_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing problematic policies
DROP POLICY IF EXISTS "View permissions" ON public.permissions;
DROP POLICY IF EXISTS "Manage permissions" ON public.permissions;
DROP POLICY IF EXISTS "View boards" ON public.boards;
DROP POLICY IF EXISTS "Update boards" ON public.boards;

-- 3. Redefine Permissions Policies using the safe function
-- This breaks the loop because getting the owner no longer triggers RLS on boards
CREATE POLICY "View permissions" ON public.permissions FOR SELECT USING (
   (public.get_board_owner_id(resource_id) = auth.uid()) OR
   user_id = auth.uid()
);

CREATE POLICY "Manage permissions" ON public.permissions FOR ALL USING (
   (public.get_board_owner_id(resource_id) = auth.uid())
);

-- 4. Redefine Boards Policies
-- These can now safely query permissions because permissions RLS won't loop back to boards RLS
CREATE POLICY "View boards" ON public.boards FOR SELECT USING (
  auth.uid() = owner_id OR 
  EXISTS (SELECT 1 FROM public.permissions WHERE resource_id = id AND resource_type = 'board' AND user_id = auth.uid())
);

CREATE POLICY "Update boards" ON public.boards FOR UPDATE USING (
  auth.uid() = owner_id OR 
  EXISTS (SELECT 1 FROM public.permissions WHERE resource_id = id AND resource_type = 'board' AND user_id = auth.uid() AND access_level IN ('edit', 'admin'))
);
