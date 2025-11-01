// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Minimal JSON helper used in table shapes below. */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

/** ---- Database typings (same as before, trimmed for brevity) ---- */
export type Database = {
  public: {
    Tables: {
      cases: {
        Row: {
          id: string;
          case_number: string;
          title: string;
          description: string;
          status: string;
          case_type: string;
          priority: string | null;
          region: string | null;
          assigned_officer_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['cases']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['cases']['Insert']>;
      };
      parties: {
        Row: {
          id: string;
          case_id: string;
          name: string;
          party_type: string;
          role: string;
          contact_info: Json | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['parties']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['parties']['Insert']>;
      };
      documents: {
        Row: {
          id: string;
          case_id: string;
          title: string;
          description: string | null;
          file_url: string;
          file_type: string;
          file_size: number | null;
          document_type: string | null;
          uploaded_by: string;
          uploaded_at: string;
        };
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['documents']['Insert']>;
      };
      tasks: {
        Row: {
          id: string;
          case_id: string;
          title: string;
          description: string | null;
          assigned_to: string | null;
          due_date: string;
          status: string;
          priority: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>;
      };
      events: {
        Row: {
          id: string;
          case_id: string;
          event_type: string;
          title: string;
          description: string | null;
          event_date: string;
          location: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
      };
      land_parcels: {
        Row: {
          id: string;
          case_id: string;
          parcel_number: string;
          location: string | null;
          coordinates: Json | null;
          area_sqm: number | null;
          survey_plan_url: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['land_parcels']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['land_parcels']['Insert']>;
      };
    };
  };
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
