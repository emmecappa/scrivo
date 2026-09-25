import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          icon: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          icon?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      pages: {
        Row: {
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
        };
        Insert: {
          id?: string;
          workspace_id: string;
          parent_id?: string | null;
          title?: string;
          icon?: string;
          cover?: string | null;
          position?: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          is_trashed?: boolean;
          is_favorite?: boolean;
        };
      };
      blocks: {
        Row: {
          id: string;
          page_id: string;
          type: string;
          content: any;
          position: number;
          parent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          page_id: string;
          type: string;
          content?: any;
          position?: number;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: 'owner' | 'editor' | 'viewer';
          invited_at: string;
          joined_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: 'owner' | 'editor' | 'viewer';
          invited_at?: string;
          joined_at?: string | null;
        };
      };
    };
  };
};
