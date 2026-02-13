-- ============================================
-- Card Features — NUCLEAR FIX
-- Drops ALL existing policies then creates clean ones
-- Safe to run multiple times
-- ============================================

-- Step 1: Drop ALL policies on card_labels (regardless of name)
DO $$
DECLARE pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'card_labels' LOOP
        EXECUTE format('DROP POLICY %I ON card_labels', pol.policyname);
    END LOOP;
END $$;

-- Step 2: Drop ALL policies on card_checklists
DO $$
DECLARE pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'card_checklists' LOOP
        EXECUTE format('DROP POLICY %I ON card_checklists', pol.policyname);
    END LOOP;
END $$;

-- Step 3: Drop ALL policies on card_members
DO $$
DECLARE pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'card_members' LOOP
        EXECUTE format('DROP POLICY %I ON card_members', pol.policyname);
    END LOOP;
END $$;

-- Step 4: Drop ALL policies on card_comments
DO $$
DECLARE pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'card_comments' LOOP
        EXECUTE format('DROP POLICY %I ON card_comments', pol.policyname);
    END LOOP;
END $$;

-- Step 5: Create tables if they don't exist
CREATE TABLE IF NOT EXISTS card_labels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366f1',
    text TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS card_checklists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    is_checked BOOLEAN DEFAULT false,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS card_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(card_id, user_id)
);

CREATE TABLE IF NOT EXISTS card_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Step 6: Ensure due_date column exists
ALTER TABLE cards ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

-- Step 7: Enable RLS on all tables
ALTER TABLE card_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_comments ENABLE ROW LEVEL SECURITY;

-- Step 8: Create simple, permissive policies for authenticated users
CREATE POLICY "labels_all" ON card_labels FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "checklists_all" ON card_checklists FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "members_all" ON card_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "comments_all" ON card_comments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Step 9: Verify — this should show 4 policies, one per table
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('card_labels', 'card_checklists', 'card_members', 'card_comments')
ORDER BY tablename;
