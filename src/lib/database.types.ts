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

// ============================================
// LITIGATION WORKFLOW TYPES (Added Feb 24, 2026)
// ============================================

export interface LitigationDatabase extends Database {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      case_delegations: {
        Row: {
          id: string
          case_id: string
          assigned_to: string
          assigned_by: string
          assigned_date: string
          assignment_type: 'initial' | 'reassignment' | 'additional'
          assignment_notes: string | null
          is_active: boolean
          deactivated_at: string | null
          deactivated_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          case_id: string
          assigned_to: string
          assigned_by: string
          assigned_date?: string
          assignment_type?: 'initial' | 'reassignment' | 'additional'
          assignment_notes?: string | null
          is_active?: boolean
          deactivated_at?: string | null
          deactivated_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          case_id?: string
          assigned_to?: string
          assigned_by?: string
          assigned_date?: string
          assignment_type?: 'initial' | 'reassignment' | 'additional'
          assignment_notes?: string | null
          is_active?: boolean
          deactivated_at?: string | null
          deactivated_by?: string | null
          created_at?: string
        }
      }
      filings: {
        Row: {
          id: string
          case_id: string
          filing_type: string
          filing_title: string
          filing_subtype: string | null
          description: string | null
          draft_file_url: string | null
          draft_uploaded_by: string | null
          draft_uploaded_at: string | null
          sealed_file_url: string | null
          sealed_uploaded_by: string | null
          sealed_uploaded_at: string | null
          status: 'draft' | 'prepared' | 'under_review' | 'changes_requested' | 'approved' | 'filed'
          court_filing_date: string | null
          court_filing_reference: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          case_id: string
          filing_type: string
          filing_title: string
          filing_subtype?: string | null
          description?: string | null
          draft_file_url?: string | null
          draft_uploaded_by?: string | null
          draft_uploaded_at?: string | null
          sealed_file_url?: string | null
          sealed_uploaded_by?: string | null
          sealed_uploaded_at?: string | null
          status?: 'draft' | 'prepared' | 'under_review' | 'changes_requested' | 'approved' | 'filed'
          court_filing_date?: string | null
          court_filing_reference?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          case_id?: string
          filing_type?: string
          filing_title?: string
          filing_subtype?: string | null
          description?: string | null
          draft_file_url?: string | null
          draft_uploaded_by?: string | null
          draft_uploaded_at?: string | null
          sealed_file_url?: string | null
          sealed_uploaded_by?: string | null
          sealed_uploaded_at?: string | null
          status?: 'draft' | 'prepared' | 'under_review' | 'changes_requested' | 'approved' | 'filed'
          court_filing_date?: string | null
          court_filing_reference?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      filing_reviews: {
        Row: {
          id: string
          filing_id: string
          reviewed_by: string
          review_date: string
          decision: 'changes_requested' | 'approved' | 'rejected'
          comments: string | null
          changes_required: string | null
          created_at: string
        }
        Insert: {
          id?: string
          filing_id: string
          reviewed_by: string
          review_date?: string
          decision: 'changes_requested' | 'approved' | 'rejected'
          comments?: string | null
          changes_required?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          filing_id?: string
          reviewed_by?: string
          review_date?: string
          decision?: 'changes_requested' | 'approved' | 'rejected'
          comments?: string | null
          changes_required?: string | null
          created_at?: string
        }
      }
      case_progress_updates: {
        Row: {
          id: string
          case_id: string
          stage_type: string
          stage_title: string
          stage_date: string | null
          description: string | null
          outcome: string | null
          next_steps: string | null
          document_url: string | null
          updated_by: string
          created_at: string
        }
        Insert: {
          id?: string
          case_id: string
          stage_type: string
          stage_title: string
          stage_date?: string | null
          description?: string | null
          outcome?: string | null
          next_steps?: string | null
          document_url?: string | null
          updated_by: string
          created_at?: string
        }
        Update: {
          id?: string
          case_id?: string
          stage_type?: string
          stage_title?: string
          stage_date?: string | null
          description?: string | null
          outcome?: string | null
          next_steps?: string | null
          document_url?: string | null
          updated_by?: string
          created_at?: string
        }
      }
      case_judgments: {
        Row: {
          id: string
          case_id: string
          judgment_date: string
          judgment_type: string | null
          decision_summary: string
          terms_of_orders: string | null
          judges_names: string | null
          judgment_document_url: string | null
          compliance_memo_url: string | null
          compliance_memo_uploaded_by: string | null
          compliance_memo_uploaded_at: string | null
          compliance_notes: string | null
          entered_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          case_id: string
          judgment_date: string
          judgment_type?: string | null
          decision_summary: string
          terms_of_orders?: string | null
          judges_names?: string | null
          judgment_document_url?: string | null
          compliance_memo_url?: string | null
          compliance_memo_uploaded_by?: string | null
          compliance_memo_uploaded_at?: string | null
          compliance_notes?: string | null
          entered_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          case_id?: string
          judgment_date?: string
          judgment_type?: string | null
          decision_summary?: string
          terms_of_orders?: string | null
          judges_names?: string | null
          judgment_document_url?: string | null
          compliance_memo_url?: string | null
          compliance_memo_uploaded_by?: string | null
          compliance_memo_uploaded_at?: string | null
          compliance_notes?: string | null
          entered_by?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Helper types for new tables
export type CaseDelegation = LitigationDatabase['public']['Tables']['case_delegations']['Row']
export type Filing = LitigationDatabase['public']['Tables']['filings']['Row']
export type FilingReview = LitigationDatabase['public']['Tables']['filing_reviews']['Row']
export type CaseProgressUpdate = LitigationDatabase['public']['Tables']['case_progress_updates']['Row']
export type CaseJudgment = LitigationDatabase['public']['Tables']['case_judgments']['Row']

export type FilingStatus = 'draft' | 'prepared' | 'under_review' | 'changes_requested' | 'approved' | 'filed'
export type ReviewDecision = 'changes_requested' | 'approved' | 'rejected'
export type WorkflowState = 'REGISTERED' | 'ASSIGNED' | 'REGISTRATION_COMPLETED' | 'DRAFTING' | 'UNDER_REVIEW' | 'APPROVED_FOR_FILING' | 'FILED' | 'IN_PROGRESS' | 'JUDGMENT_ENTERED' | 'CLOSED'
