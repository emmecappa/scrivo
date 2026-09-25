import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  created_by: string;
  created_at: string;
}

export interface Page {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  title: string;
  icon: string;
  cover: string | null;
  position: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_trashed: boolean;
  is_favorite: boolean;
}

export interface Block {
  id: string;
  page_id: string;
  type: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'bullet_list' | 'ordered_list' | 'task_list' | 'code' | 'quote' | 'divider' | 'image' | 'callout';
  content: any;
  position: number;
  parent_id: string | null;
}

interface AppState {
  // Config
  isConfigured: boolean;
  
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  
  // Workspace
  workspace: Workspace | null;
  
  // Pages
  pages: Page[];
  currentPageId: string | null;
  expandedPages: Set<string>;
  
  // Blocks
  blocks: Block[];
  
  // UI
  sidebarOpen: boolean;
  isCreatingPage: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  
  loadWorkspace: () => Promise<void>;
  createWorkspace: (name: string) => Promise<void>;
  
  loadPages: () => Promise<void>;
  createPage: (parentId?: string | null) => Promise<string>;
  updatePage: (id: string, updates: Partial<Page>) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
  setCurrentPage: (id: string | null) => void;
  togglePageExpanded: (id: string) => void;
  
  loadBlocks: (pageId: string) => Promise<void>;
  saveBlocks: (pageId: string, blocks: Block[]) => Promise<void>;
  
  toggleSidebar: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  isConfigured: isSupabaseConfigured,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  authError: null,
  workspace: null,
  pages: [],
  currentPageId: null,
  expandedPages: new Set(),
  blocks: [],
  sidebarOpen: true,
  isCreatingPage: false,

  login: async (email, password) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase non configurato. Aggiungi le variabili VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      set({
        user: {
          id: data.user.id,
          email: data.user.email || '',
          full_name: data.user.user_metadata?.full_name || '',
          avatar_url: data.user.user_metadata?.avatar_url || '',
        },
        isAuthenticated: true,
        authError: null,
      });
      await get().loadWorkspace();
    }
  },

  signup: async (email, password, fullName) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase non configurato. Aggiungi le variabili VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    if (data.user) {
      set({
        user: {
          id: data.user.id,
          email: data.user.email || '',
          full_name: fullName,
          avatar_url: '',
        },
        isAuthenticated: true,
        authError: null,
      });
    }
  },

  logout: async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    set({ user: null, isAuthenticated: false, workspace: null, pages: [], currentPageId: null, blocks: [] });
  },

  checkAuth: async () => {
    if (!isSupabaseConfigured) {
      set({ isLoading: false, authError: 'Supabase non configurato' });
      return;
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({
          user: {
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || '',
            avatar_url: session.user.user_metadata?.avatar_url || '',
          },
          isAuthenticated: true,
          isLoading: false,
          authError: null,
        });
        await get().loadWorkspace();
      } else {
        set({ isLoading: false });
      }
    } catch (err: any) {
      console.error('Auth check error:', err);
      set({ isLoading: false, authError: err.message || 'Errore di connessione' });
    }
  },

  loadWorkspace: async () => {
    const { user } = get();
    if (!user || !isSupabaseConfigured) return;
    
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('created_by', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Load workspace error:', error);
        return;
      }
      
      if (data) {
        set({ workspace: data as Workspace });
        await get().loadPages();
      }
    } catch (err) {
      console.error('Load workspace error:', err);
    }
  },

  createWorkspace: async (name) => {
    const { user } = get();
    if (!user || !isSupabaseConfigured) return;
    
    const id = uuidv4();
    const { data, error } = await supabase
      .from('workspaces')
      .insert({
        id,
        name,
        icon: '📝',
        created_by: user.id,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Add creator as owner member
    await supabase.from('workspace_members').insert({
      workspace_id: id,
      user_id: user.id,
      role: 'owner',
    });
    
    set({ workspace: data as Workspace });
    
    // Create initial page
    await get().createPage();
  },

  loadPages: async () => {
    const { workspace } = get();
    if (!workspace || !isSupabaseConfigured) return;
    
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('workspace_id', workspace.id)
        .eq('is_trashed', false)
        .order('position');
      
      if (error) {
        console.error('Load pages error:', error);
        return;
      }
      
      if (data) {
        set({ pages: data as Page[] });
      }
    } catch (err) {
      console.error('Load pages error:', err);
    }
  },

  createPage: async (parentId = null) => {
    const { user, workspace, pages } = get();
    if (!user || !workspace || !isSupabaseConfigured) return '';
    
    const id = uuidv4();
    const position = pages.length;
    
    const { data, error } = await supabase
      .from('pages')
      .insert({
        id,
        workspace_id: workspace.id,
        parent_id: parentId,
        title: '',
        icon: '📄',
        position,
        created_by: user.id,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Create initial empty block
    await supabase.from('blocks').insert({
      id: uuidv4(),
      page_id: id,
      type: 'paragraph',
      content: { text: '' },
      position: 0,
    });
    
    await get().loadPages();
    set({ currentPageId: id });
    
    if (parentId) {
      const expanded = new Set(get().expandedPages);
      expanded.add(parentId);
      set({ expandedPages: expanded });
    }
    
    return id;
  },

  updatePage: async (id, updates) => {
    if (!isSupabaseConfigured) return;
    
    try {
      await supabase
        .from('pages')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      await get().loadPages();
    } catch (err) {
      console.error('Update page error:', err);
    }
  },

  deletePage: async (id) => {
    if (!isSupabaseConfigured) return;
    
    try {
      await supabase
        .from('pages')
        .update({ is_trashed: true })
        .eq('id', id);
      
      const { currentPageId } = get();
      if (currentPageId === id) {
        set({ currentPageId: null });
      }
      
      await get().loadPages();
    } catch (err) {
      console.error('Delete page error:', err);
    }
  },

  setCurrentPage: (id) => set({ currentPageId: id }),

  togglePageExpanded: (id) => {
    const expanded = new Set(get().expandedPages);
    if (expanded.has(id)) {
      expanded.delete(id);
    } else {
      expanded.add(id);
    }
    set({ expandedPages: expanded });
  },

  loadBlocks: async (pageId) => {
    if (!isSupabaseConfigured) return;
    
    try {
      const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('page_id', pageId)
        .order('position');
      
      if (error) {
        console.error('Load blocks error:', error);
        return;
      }
      
      if (data) {
        set({ blocks: data as Block[] });
      }
    } catch (err) {
      console.error('Load blocks error:', err);
    }
  },

  saveBlocks: async (pageId, blocks) => {
    if (!isSupabaseConfigured) return;
    
    try {
      // Delete existing blocks and insert new ones
      await supabase.from('blocks').delete().eq('page_id', pageId);
      
      if (blocks.length > 0) {
        await supabase.from('blocks').insert(
          blocks.map((block, index) => ({
            id: uuidv4(),
            page_id: pageId,
            type: block.type,
            content: block.content,
            position: index,
            parent_id: block.parent_id,
          }))
        );
      }
      
      set({ blocks });
      
      // Update page timestamp
      await supabase
        .from('pages')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', pageId);
    } catch (err) {
      console.error('Save blocks error:', err);
    }
  },

  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
}));
