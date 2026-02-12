-- Create Custom Types
CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'contributor', 'viewer');
CREATE TYPE public.payment_status AS ENUM ('pending', 'partial', 'paid');
CREATE TYPE public.permission_type AS ENUM ('view', 'edit', 'admin');
CREATE TYPE public.resource_type AS ENUM ('board', 'card');
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users Table (Extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role public.user_role DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Boards Table
CREATE TABLE public.boards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  background TEXT,
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Lists Table
CREATE TABLE public.lists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  position FLOAT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cards Table
CREATE TABLE public.cards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  list_id UUID REFERENCES public.lists(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  position FLOAT NOT NULL DEFAULT 0,
  budget NUMERIC,
  payment_status public.payment_status DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Permissions Table
CREATE TABLE public.permissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  resource_type public.resource_type NOT NULL,
  resource_id UUID NOT NULL,
  access_level public.permission_type DEFAULT 'view',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Revenue Logs Table
CREATE TABLE public.revenue_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  transaction_type public.transaction_type NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies (Basic Setup - to be refined)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_logs ENABLE ROW LEVEL SECURITY;

-- RLS Helper Function: Check if user has access to a board
CREATE OR REPLACE FUNCTION public.has_board_access(board_id UUID, required_level text DEFAULT 'view')
RETURNS boolean AS $$
DECLARE
  current_user_id UUID;
  is_owner BOOLEAN;
  user_access_level public.permission_type;
BEGIN
  current_user_id := auth.uid();
  
  -- Check ownership
  SELECT (owner_id = current_user_id) INTO is_owner FROM public.boards WHERE id = board_id;
  IF is_owner THEN
    RETURN true;
  END IF;
  
  -- Check permissions
  SELECT access_level INTO user_access_level 
  FROM public.permissions 
  WHERE resource_id = board_id 
    AND resource_type = 'board' 
    AND user_id = current_user_id;

  IF user_access_level IS NULL THEN
    RETURN false;
  END IF;

  IF required_level = 'view' THEN
    RETURN true; -- Any access level can view
  ELSIF required_level = 'edit' THEN
    RETURN user_access_level IN ('edit', 'admin');
  ELSIF required_level = 'admin' THEN
    RETURN user_access_level = 'admin';
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- BOARDS POLICIES
CREATE POLICY "View boards" ON public.boards FOR SELECT USING (
  auth.uid() = owner_id OR 
  EXISTS (SELECT 1 FROM public.permissions WHERE resource_id = id AND resource_type = 'board' AND user_id = auth.uid())
);

CREATE POLICY "Create boards" ON public.boards FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Update boards" ON public.boards FOR UPDATE USING (
  auth.uid() = owner_id OR 
  EXISTS (SELECT 1 FROM public.permissions WHERE resource_id = id AND resource_type = 'board' AND user_id = auth.uid() AND access_level IN ('edit', 'admin'))
);

CREATE POLICY "Delete boards" ON public.boards FOR DELETE USING (auth.uid() = owner_id);


-- LISTS POLICIES (Inherit from Board)
CREATE POLICY "View lists" ON public.lists FOR SELECT USING (
  public.has_board_access(board_id, 'view')
);

CREATE POLICY "Manage lists" ON public.lists FOR ALL USING (
  public.has_board_access(board_id, 'edit')
);


-- CARDS POLICIES (Inherit from List -> Board)
CREATE POLICY "View cards" ON public.cards FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.lists 
    WHERE lists.id = list_id 
    AND public.has_board_access(lists.board_id, 'view')
  )
);

CREATE POLICY "Manage cards" ON public.cards FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.lists 
    WHERE lists.id = list_id 
    AND public.has_board_access(lists.board_id, 'edit')
  )
);


-- PERMISSIONS POLICIES
-- Only board owners or admins can manage permissions for that board
CREATE POLICY "View permissions" ON public.permissions FOR SELECT USING (
   EXISTS (SELECT 1 FROM public.boards WHERE id = resource_id AND (owner_id = auth.uid())) OR
   user_id = auth.uid() -- Users can see their own permissions
);

CREATE POLICY "Manage permissions" ON public.permissions FOR ALL USING (
   EXISTS (
     SELECT 1 FROM public.boards 
     WHERE id = resource_id 
     AND owner_id = auth.uid() -- Only owner can manage permissions for now for simplicity
   )
);


-- REVENUE LOGS POLICIES
CREATE POLICY "View revenue" ON public.revenue_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.cards
    JOIN public.lists ON cards.list_id = lists.id
    WHERE cards.id = card_id
    AND public.has_board_access(lists.board_id, 'view')
  )
);

CREATE POLICY "Manage revenue" ON public.revenue_logs FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.cards
    JOIN public.lists ON cards.list_id = lists.id
    WHERE cards.id = card_id
    AND public.has_board_access(lists.board_id, 'edit')
  )
);

-- Enable Realtime for all relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.boards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cards;

-- Trigger to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
