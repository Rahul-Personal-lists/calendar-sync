import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Server-side client with service role (for API routes)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string;
        };
        Update: {
          email?: string;
          name?: string;
        };
      };
      connected_accounts: {
        Row: {
          id: string;
          user_id: string;
          provider: 'google' | 'outlook' | 'notion';
          access_token: string;
          refresh_token?: string;
          expires_at?: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          provider: 'google' | 'outlook' | 'notion';
          access_token: string;
          refresh_token?: string;
          expires_at?: number;
        };
        Update: {
          access_token?: string;
          refresh_token?: string;
          expires_at?: number;
        };
      };
      events: {
        Row: {
          id: string;
          user_id: string; // Email address
          provider: 'google' | 'outlook' | 'notion' | 'apple';
          title: string;
          description?: string;
          start_time: string;
          end_time: string;
          location?: string;
          notion_page_id?: string;
          google_event_id?: string;
          outlook_event_id?: string;
          apple_event_id?: string;
          color?: string;
          is_all_day: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string; // Email address
          provider: 'google' | 'outlook' | 'notion' | 'apple';
          title: string;
          description?: string;
          start_time: string;
          end_time: string;
          location?: string;
          notion_page_id?: string;
          google_event_id?: string;
          outlook_event_id?: string;
          apple_event_id?: string;
          color?: string;
          is_all_day?: boolean;
        };
        Update: {
          title?: string;
          description?: string;
          start_time?: string;
          end_time?: string;
          location?: string;
          color?: string;
          is_all_day?: boolean;
        };
      };
      sync_logs: {
        Row: {
          id: string;
          user_id: string;
          provider: 'google' | 'outlook' | 'notion';
          status: 'success' | 'error';
          events_synced?: number;
          error_message?: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          provider: 'google' | 'outlook' | 'notion';
          status: 'success' | 'error';
          events_synced?: number;
          error_message?: string;
        };
      };
    };
  };
} 