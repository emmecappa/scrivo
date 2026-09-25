-- ============================================
-- SUPABASE DATABASE SCHEMA - NOTION CLONE
-- ============================================
-- Esegui questo SQL nell'editor SQL di Supabase
-- (Dashboard > SQL Editor > New Query)
-- ============================================

-- 1. Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📝',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Pages (documenti/pagine)
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  title TEXT DEFAULT '',
  icon TEXT DEFAULT '📄',
  cover TEXT,
  position INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_trashed BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE
);

-- 3. Blocks (blocchi di contenuto)
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'paragraph',
  content JSONB DEFAULT '{}',
  position INTEGER DEFAULT 0,
  parent_id UUID REFERENCES blocks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Workspace Members
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  UNIQUE(workspace_id, user_id)
);

-- 5. Indexes per performance
CREATE INDEX IF NOT EXISTS idx_pages_workspace ON pages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_pages_parent ON pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_pages_created_by ON pages(created_by);
CREATE INDEX IF NOT EXISTS idx_blocks_page ON blocks(page_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);

-- 6. Row Level Security (RLS)
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Workspaces: visibili ai membri
CREATE POLICY "Members can view workspaces" ON workspaces
  FOR SELECT USING (
    created_by = auth.uid() OR
    id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can update workspaces" ON workspaces
  FOR UPDATE USING (
    created_by = auth.uid() OR
    id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor'))
  );

CREATE POLICY "Authenticated users can create workspaces" ON workspaces
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Pages: visibili ai membri del workspace
CREATE POLICY "Members can view pages" ON pages
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE created_by = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create pages" ON pages
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE created_by = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Members can update pages" ON pages
  FOR UPDATE USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE created_by = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Members can delete pages" ON pages
  FOR DELETE USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE created_by = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Blocks: visibili ai membri del workspace della pagina
CREATE POLICY "Members can view blocks" ON blocks
  FOR SELECT USING (
    page_id IN (
      SELECT id FROM pages WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE created_by = auth.uid()
        UNION
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Members can manage blocks" ON blocks
  FOR ALL USING (
    page_id IN (
      SELECT id FROM pages WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE created_by = auth.uid()
        UNION
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
      )
    )
  );

-- Workspace Members
CREATE POLICY "Members can view workspace members" ON workspace_members
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE created_by = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage members" ON workspace_members
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE created_by = auth.uid()
    )
  );

-- 7. Realtime (per collaborazione in tempo reale)
-- Abilita realtime per le tabelle
ALTER PUBLICATION supabase_realtime ADD TABLE blocks;
ALTER PUBLICATION supabase_realtime ADD TABLE pages;

-- 8. Function per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_blocks_updated_at
  BEFORE UPDATE ON blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
