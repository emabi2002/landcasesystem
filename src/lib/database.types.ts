export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      cases: {
        Row: {
          id: string
          case_number: string
          title: string | null
          description: string | null
          status: string
          priority: string
          case_type: string
          region: string | null
          dlpp_role: string | null
          workflow_status: string | null
          closure_type: string | null
          closed_date: string | null
          closure_notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          case_number: string
          title?: string | null
          description?: string | null
          status?: string
          priority?: string
          case_type?: string
          region?: string | null
          dlpp_role?: string | null
          workflow_status?: string | null
          closure_type?: string | null
          closed_date?: string | null
          closure_notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          case_number?: string
          title?: string | null
          description?: string | null
          status?: string
          priority?: string
          case_type?: string
          region?: string | null
          dlpp_role?: string | null
          workflow_status?: string | null
          closure_type?: string | null
          closed_date?: string | null
          closure_notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      directions: {
        Row: {
          id: string
          direction_number: string
          source: string
          issued_by: string | null
          issued_date: string
          subject: string
          content: string
          priority: string
          due_date: string | null
          assigned_to: string | null
          status: string
          case_id: string | null
          completed_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          direction_number: string
          source: string
          issued_by?: string | null
          issued_date: string
          subject: string
          content: string
          priority?: string
          due_date?: string | null
          assigned_to?: string | null
          status?: string
          case_id?: string | null
          completed_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          direction_number?: string
          source?: string
          issued_by?: string | null
          issued_date?: string
          subject?: string
          content?: string
          priority?: string
          due_date?: string | null
          assigned_to?: string | null
          status?: string
          case_id?: string | null
          completed_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      case_delegations: {
        Row: {
          id: string
          case_id: string
          delegated_by: string
          delegated_to: string
          delegation_date: string
          instructions: string | null
          status: string
          completed_date: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          case_id: string
          delegated_by: string
          delegated_to: string
          delegation_date?: string
          instructions?: string | null
          status?: string
          completed_date?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          case_id?: string
          delegated_by?: string
          delegated_to?: string
          delegation_date?: string
          instructions?: string | null
          status?: string
          completed_date?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      filings: {
        Row: {
          id: string
          case_id: string
          filing_type: string
          title: string
          description: string | null
          prepared_by: string | null
          prepared_date: string | null
          submitted_to: string | null
          submission_date: string | null
          filing_number: string | null
          court_filing_date: string | null
          status: string
          status_update_date: string | null
          status_notes: string | null
          file_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          case_id: string
          filing_type?: string
          title: string
          description?: string | null
          prepared_by?: string | null
          prepared_date?: string | null
          submitted_to?: string | null
          submission_date?: string | null
          filing_number?: string | null
          court_filing_date?: string | null
          status?: string
          status_update_date?: string | null
          status_notes?: string | null
          file_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          case_id?: string
          filing_type?: string
          title?: string
          description?: string | null
          prepared_by?: string | null
          prepared_date?: string | null
          submitted_to?: string | null
          submission_date?: string | null
          filing_number?: string | null
          court_filing_date?: string | null
          status?: string
          status_update_date?: string | null
          status_notes?: string | null
          file_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      compliance_tracking: {
        Row: {
          id: string
          case_id: string
          court_order_reference: string | null
          court_order_date: string | null
          court_order_description: string
          compliance_deadline: string | null
          responsible_division: string
          memo_reference: string | null
          memo_sent_date: string | null
          memo_sent_by: string | null
          compliance_status: string
          completion_date: string | null
          compliance_notes: string | null
          attachments: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          case_id: string
          court_order_reference?: string | null
          court_order_date?: string | null
          court_order_description: string
          compliance_deadline?: string | null
          responsible_division: string
          memo_reference?: string | null
          memo_sent_date?: string | null
          memo_sent_by?: string | null
          compliance_status?: string
          completion_date?: string | null
          compliance_notes?: string | null
          attachments?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          case_id?: string
          court_order_reference?: string | null
          court_order_date?: string | null
          court_order_description?: string
          compliance_deadline?: string | null
          responsible_division?: string
          memo_reference?: string | null
          memo_sent_date?: string | null
          memo_sent_by?: string | null
          compliance_status?: string
          completion_date?: string | null
          compliance_notes?: string | null
          attachments?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      communications: {
        Row: {
          id: string
          case_id: string
          communication_type: string
          direction: string
          party_type: string
          party_name: string | null
          party_id: string | null
          subject: string
          content: string | null
          communication_date: string
          handled_by: string | null
          response_required: boolean
          response_deadline: string | null
          response_status: string
          attachments: Json | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          case_id: string
          communication_type?: string
          direction: string
          party_type?: string
          party_name?: string | null
          party_id?: string | null
          subject: string
          content?: string | null
          communication_date: string
          handled_by?: string | null
          response_required?: boolean
          response_deadline?: string | null
          response_status?: string
          attachments?: Json | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          case_id?: string
          communication_type?: string
          direction?: string
          party_type?: string
          party_name?: string | null
          party_id?: string | null
          subject?: string
          content?: string | null
          communication_date?: string
          handled_by?: string | null
          response_required?: boolean
          response_deadline?: string | null
          response_status?: string
          attachments?: Json | null
          notes?: string | null
          created_at?: string
        }
      }
      case_history: {
        Row: {
          id: string
          case_id: string
          action: string
          description: string | null
          metadata: Json | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          case_id: string
          action: string
          description?: string | null
          metadata?: Json | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          case_id?: string
          action?: string
          description?: string | null
          metadata?: Json | null
          created_at?: string
          created_by?: string | null
        }
      }
      parties: {
        Row: {
          id: string
          case_id: string
          name: string
          party_type: string
          role: string
          contact_info: Json | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          case_id: string
          name: string
          party_type: string
          role: string
          contact_info?: Json | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          case_id?: string
          name?: string
          party_type?: string
          role?: string
          contact_info?: Json | null
          notes?: string | null
          created_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          case_id: string
          title: string
          description: string | null
          file_url: string | null
          file_type: string | null
          file_path: string | null
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          id?: string
          case_id: string
          title: string
          description?: string | null
          file_url?: string | null
          file_type?: string | null
          file_path?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          id?: string
          case_id?: string
          title?: string
          description?: string | null
          file_url?: string | null
          file_type?: string | null
          file_path?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          role: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          phone?: string | null
          role?: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          role?: string
          is_active?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      cases_with_parties: {
        Row: {
          id: string
          case_number: string
          title: string | null
          status: string
          priority: string
          case_type: string
          plaintiffs: string | null
          defendants: string | null
          created_at: string
        }
      }
    }
    Functions: {}
    Enums: {}
  }
}
