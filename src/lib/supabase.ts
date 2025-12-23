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
          closure_type: string | null;
          case_origin: string | null;
          court_file_number: string | null;
          closure_date: string | null;
          closure_notes: string | null;
          first_hearing_date: string | null;
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
      incoming_correspondence: {
        Row: {
          id: string;
          reference_number: string;
          document_type: string;
          source: string;
          received_date: string;
          received_by: string | null;
          subject: string;
          description: string | null;
          file_url: string | null;
          acknowledgement_sent: boolean;
          acknowledgement_date: string | null;
          acknowledgement_number: string | null;
          case_id: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['incoming_correspondence']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['incoming_correspondence']['Insert']>;
      };
      directions: {
        Row: {
          id: string;
          direction_number: string;
          source: string;
          issued_by: string | null;
          issued_date: string;
          subject: string;
          content: string;
          priority: string;
          due_date: string | null;
          assigned_to: string | null;
          status: string;
          case_id: string | null;
          completed_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['directions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['directions']['Insert']>;
      };
      file_requests: {
        Row: {
          id: string;
          case_id: string;
          file_type: string;
          file_number: string | null;
          requested_by: string | null;
          requested_date: string;
          status: string;
          received_date: string | null;
          current_location: string | null;
          custodian: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['file_requests']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['file_requests']['Insert']>;
      };
      case_delegations: {
        Row: {
          id: string;
          case_id: string;
          delegated_by: string;
          delegated_to: string;
          delegation_date: string;
          instructions: string | null;
          status: string;
          completed_date: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['case_delegations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['case_delegations']['Insert']>;
      };
      external_lawyers: {
        Row: {
          id: string;
          name: string;
          organization: string;
          lawyer_type: string;
          contact_email: string | null;
          contact_phone: string | null;
          address: string | null;
          specialization: string | null;
          active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['external_lawyers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['external_lawyers']['Insert']>;
      };
      filings: {
        Row: {
          id: string;
          case_id: string;
          filing_type: string;
          title: string;
          description: string | null;
          prepared_by: string | null;
          prepared_date: string | null;
          submitted_to: string | null;
          submission_date: string | null;
          filing_number: string | null;
          court_filing_date: string | null;
          status: string;
          status_update_date: string | null;
          status_notes: string | null;
          file_url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['filings']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['filings']['Insert']>;
      };
      compliance_tracking: {
        Row: {
          id: string;
          case_id: string;
          court_order_reference: string | null;
          court_order_date: string | null;
          court_order_description: string;
          compliance_deadline: string | null;
          responsible_division: string;
          memo_reference: string | null;
          memo_sent_date: string | null;
          memo_sent_by: string | null;
          compliance_status: string;
          completion_date: string | null;
          compliance_notes: string | null;
          attachments: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['compliance_tracking']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['compliance_tracking']['Insert']>;
      };
      communications: {
        Row: {
          id: string;
          case_id: string;
          communication_type: string;
          direction: string;
          party_type: string;
          party_name: string | null;
          party_id: string | null;
          subject: string;
          content: string | null;
          communication_date: string;
          handled_by: string | null;
          response_required: boolean;
          response_deadline: string | null;
          response_status: string;
          attachments: Json | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['communications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['communications']['Insert']>;
      };
    };
  };
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
