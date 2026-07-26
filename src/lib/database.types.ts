export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      action_officers: {
        Row: {
          created_at: string
          display_order: number
          division: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          division?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number
          division?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          module_id: string | null
          record_id: string | null
          record_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          module_id?: string | null
          record_id?: string | null
          record_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          module_id?: string | null
          record_id?: string | null
          record_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      case_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          assigned_to: string | null
          assignment_type: string | null
          case_id: string
          completed_at: string | null
          created_at: string
          id: string
          instructions: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          assigned_to?: string | null
          assignment_type?: string | null
          case_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          instructions?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          assigned_to?: string | null
          assignment_type?: string | null
          case_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          instructions?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_assignments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_assignments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_categories: {
        Row: {
          code: string | null
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      case_closures: {
        Row: {
          case_id: string
          closed_by: string | null
          closure_date: string | null
          closure_notes: string | null
          closure_type: string | null
          created_at: string
          id: string
          outcome_summary: string | null
          updated_at: string
        }
        Insert: {
          case_id: string
          closed_by?: string | null
          closure_date?: string | null
          closure_notes?: string | null
          closure_type?: string | null
          created_at?: string
          id?: string
          outcome_summary?: string | null
          updated_at?: string
        }
        Update: {
          case_id?: string
          closed_by?: string | null
          closure_date?: string | null
          closure_notes?: string | null
          closure_type?: string | null
          created_at?: string
          id?: string
          outcome_summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_closures_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_closures_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      case_history: {
        Row: {
          action: string
          case_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          metadata: Json | null
          performed_by: string | null
          workflow_state_from: string | null
          workflow_state_to: string | null
        }
        Insert: {
          action: string
          case_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          workflow_state_from?: string | null
          workflow_state_to?: string | null
        }
        Update: {
          action?: string
          case_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          workflow_state_from?: string | null
          workflow_state_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_history_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      case_intake_documents: {
        Row: {
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          intake_record_id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          intake_record_id: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          intake_record_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_intake_documents_intake_record_id_fkey"
            columns: ["intake_record_id"]
            isOneToOne: false
            referencedRelation: "case_intake_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_intake_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      case_intake_records: {
        Row: {
          case_id: string | null
          created_at: string
          created_by: string | null
          date_stamped: string
          delivered_by_contact: string | null
          delivered_by_name: string | null
          document_type: string
          from_contact_person: string | null
          from_office_name: string | null
          from_party_type: string | null
          id: string
          internal_serial_number: string
          notes: string | null
          physical_folder_number: string | null
          physical_location: string | null
          received_by: string | null
          received_date: string
          source: string | null
          status: string
          updated_at: string
          urgent: boolean
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          date_stamped?: string
          delivered_by_contact?: string | null
          delivered_by_name?: string | null
          document_type: string
          from_contact_person?: string | null
          from_office_name?: string | null
          from_party_type?: string | null
          id?: string
          internal_serial_number: string
          notes?: string | null
          physical_folder_number?: string | null
          physical_location?: string | null
          received_by?: string | null
          received_date?: string
          source?: string | null
          status?: string
          updated_at?: string
          urgent?: boolean
        }
        Update: {
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          date_stamped?: string
          delivered_by_contact?: string | null
          delivered_by_name?: string | null
          document_type?: string
          from_contact_person?: string | null
          from_office_name?: string | null
          from_party_type?: string | null
          id?: string
          internal_serial_number?: string
          notes?: string | null
          physical_folder_number?: string | null
          physical_location?: string | null
          received_by?: string | null
          received_date?: string
          source?: string | null
          status?: string
          updated_at?: string
          urgent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "case_intake_records_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_intake_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_intake_records_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      case_statuses: {
        Row: {
          code: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          label: string
        }
        Insert: {
          code: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          label: string
        }
        Update: {
          code?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          label?: string
        }
        Relationships: []
      }
      cases: {
        Row: {
          assigned_officer_id: string | null
          case_number: string
          case_origin: string | null
          case_type: string | null
          closure_date: string | null
          closure_notes: string | null
          closure_type: string | null
          court_file_number: string | null
          created_at: string
          created_by: string | null
          description: string | null
          division_responsible: string | null
          dlpp_role: string | null
          first_hearing_date: string | null
          id: string
          matter_type: string | null
          priority: string | null
          region: string | null
          returnable_date: string | null
          status: string
          title: string
          track_number: string | null
          updated_at: string
          updated_by: string | null
          workflow_state: string
        }
        Insert: {
          assigned_officer_id?: string | null
          case_number: string
          case_origin?: string | null
          case_type?: string | null
          closure_date?: string | null
          closure_notes?: string | null
          closure_type?: string | null
          court_file_number?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          division_responsible?: string | null
          dlpp_role?: string | null
          first_hearing_date?: string | null
          id?: string
          matter_type?: string | null
          priority?: string | null
          region?: string | null
          returnable_date?: string | null
          status?: string
          title: string
          track_number?: string | null
          updated_at?: string
          updated_by?: string | null
          workflow_state?: string
        }
        Update: {
          assigned_officer_id?: string | null
          case_number?: string
          case_origin?: string | null
          case_type?: string | null
          closure_date?: string | null
          closure_notes?: string | null
          closure_type?: string | null
          court_file_number?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          division_responsible?: string | null
          dlpp_role?: string | null
          first_hearing_date?: string | null
          id?: string
          matter_type?: string | null
          priority?: string | null
          region?: string | null
          returnable_date?: string | null
          status?: string
          title?: string
          track_number?: string | null
          updated_at?: string
          updated_by?: string | null
          workflow_state?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_assigned_officer_id_fkey"
            columns: ["assigned_officer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      communications: {
        Row: {
          attachments: Json | null
          case_id: string
          communication_date: string
          communication_type: string
          content: string | null
          created_at: string
          direction: string
          handled_by: string | null
          id: string
          notes: string | null
          party_id: string | null
          party_name: string | null
          party_type: string
          recipient_role: string | null
          response_deadline: string | null
          response_required: boolean
          response_status: string
          subject: string
        }
        Insert: {
          attachments?: Json | null
          case_id: string
          communication_date?: string
          communication_type: string
          content?: string | null
          created_at?: string
          direction: string
          handled_by?: string | null
          id?: string
          notes?: string | null
          party_id?: string | null
          party_name?: string | null
          party_type: string
          recipient_role?: string | null
          response_deadline?: string | null
          response_required?: boolean
          response_status?: string
          subject: string
        }
        Update: {
          attachments?: Json | null
          case_id?: string
          communication_date?: string
          communication_type?: string
          content?: string | null
          created_at?: string
          direction?: string
          handled_by?: string | null
          id?: string
          notes?: string | null
          party_id?: string | null
          party_name?: string | null
          party_type?: string
          recipient_role?: string | null
          response_deadline?: string | null
          response_required?: boolean
          response_status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "communications_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_tracking: {
        Row: {
          attachments: Json | null
          case_id: string
          completion_date: string | null
          compliance_deadline: string | null
          compliance_notes: string | null
          compliance_status: string
          court_order_date: string | null
          court_order_description: string
          court_order_reference: string | null
          created_at: string
          id: string
          memo_reference: string | null
          memo_sent_by: string | null
          memo_sent_date: string | null
          responsible_division: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          case_id: string
          completion_date?: string | null
          compliance_deadline?: string | null
          compliance_notes?: string | null
          compliance_status?: string
          court_order_date?: string | null
          court_order_description: string
          court_order_reference?: string | null
          created_at?: string
          id?: string
          memo_reference?: string | null
          memo_sent_by?: string | null
          memo_sent_date?: string | null
          responsible_division: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          case_id?: string
          completion_date?: string | null
          compliance_deadline?: string | null
          compliance_notes?: string | null
          compliance_status?: string
          court_order_date?: string | null
          court_order_description?: string
          court_order_reference?: string | null
          created_at?: string
          id?: string
          memo_reference?: string | null
          memo_sent_by?: string | null
          memo_sent_date?: string | null
          responsible_division?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_tracking_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_tracking_memo_sent_by_fkey"
            columns: ["memo_sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_alerts: {
        Row: {
          case_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          id: string
          is_active: boolean
          notify_user_id: string | null
          threshold_amount: number | null
          updated_at: string
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          is_active?: boolean
          notify_user_id?: string | null
          threshold_amount?: number | null
          updated_at?: string
        }
        Update: {
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          is_active?: boolean
          notify_user_id?: string | null
          threshold_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_alerts_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_alerts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_alerts_notify_user_id_fkey"
            columns: ["notify_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_categories: {
        Row: {
          category_group: string | null
          code: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          category_group?: string | null
          code: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          category_group?: string | null
          code?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      cost_documents: {
        Row: {
          cost_id: string
          description: string | null
          document_name: string
          document_type: string | null
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          cost_id: string
          description?: string | null
          document_name: string
          document_type?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          cost_id?: string
          description?: string | null
          document_name?: string
          document_type?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_documents_cost_id_fkey"
            columns: ["cost_id"]
            isOneToOne: false
            referencedRelation: "litigation_costs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      court_orders: {
        Row: {
          case_id: string
          compliance_deadline: string | null
          created_at: string
          created_by: string | null
          description: string | null
          file_url: string | null
          id: string
          issued_by: string | null
          order_date: string | null
          order_reference: string | null
          order_type: string | null
          status: string
          updated_at: string
        }
        Insert: {
          case_id: string
          compliance_deadline?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          issued_by?: string | null
          order_date?: string | null
          order_reference?: string | null
          order_type?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          case_id?: string
          compliance_deadline?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          issued_by?: string | null
          order_date?: string | null
          order_reference?: string | null
          order_type?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "court_orders_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "court_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      directions: {
        Row: {
          assigned_to: string | null
          case_id: string | null
          completed_date: string | null
          content: string
          created_at: string
          direction_number: string
          due_date: string | null
          id: string
          issued_by: string | null
          issued_date: string
          notes: string | null
          priority: string
          source: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          case_id?: string | null
          completed_date?: string | null
          content: string
          created_at?: string
          direction_number: string
          due_date?: string | null
          id?: string
          issued_by?: string | null
          issued_date?: string
          notes?: string | null
          priority?: string
          source: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          case_id?: string | null
          completed_date?: string | null
          content?: string
          created_at?: string
          direction_number?: string
          due_date?: string | null
          id?: string
          issued_by?: string | null
          issued_date?: string
          notes?: string | null
          priority?: string
          source?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "directions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directions_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      divisions: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          case_id: string | null
          description: string | null
          document_type: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          search_warrant_id: string | null
          storage_path: string | null
          title: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          case_id?: string | null
          description?: string | null
          document_type?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          search_warrant_id?: string | null
          storage_path?: string | null
          title: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          case_id?: string | null
          description?: string | null
          document_type?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          search_warrant_id?: string | null
          storage_path?: string | null
          title?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          assigned_to: string | null
          auto_created: boolean
          case_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          event_date: string
          event_type: string
          id: string
          location: string | null
          reminder_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          auto_created?: boolean
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_date: string
          event_type: string
          id?: string
          location?: string | null
          reminder_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          auto_created?: boolean
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_date?: string
          event_type?: string
          id?: string
          location?: string | null
          reminder_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      external_lawyers: {
        Row: {
          active: boolean
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          lawyer_type: string | null
          name: string
          notes: string | null
          organization: string | null
          specialization: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          lawyer_type?: string | null
          name: string
          notes?: string | null
          organization?: string | null
          specialization?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          lawyer_type?: string | null
          name?: string
          notes?: string | null
          organization?: string | null
          specialization?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      file_requests: {
        Row: {
          case_id: string
          created_at: string
          current_location: string | null
          custodian: string | null
          file_number: string | null
          file_type: string
          id: string
          notes: string | null
          received_date: string | null
          requested_by: string | null
          requested_date: string
          status: string
          updated_at: string
        }
        Insert: {
          case_id: string
          created_at?: string
          current_location?: string | null
          custodian?: string | null
          file_number?: string | null
          file_type: string
          id?: string
          notes?: string | null
          received_date?: string | null
          requested_by?: string | null
          requested_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          case_id?: string
          created_at?: string
          current_location?: string | null
          custodian?: string | null
          file_number?: string | null
          file_type?: string
          id?: string
          notes?: string | null
          received_date?: string | null
          requested_by?: string | null
          requested_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_requests_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      filings: {
        Row: {
          case_id: string
          court_filing_date: string | null
          created_at: string
          created_by: string | null
          description: string | null
          draft_file_url: string | null
          draft_uploaded_at: string | null
          draft_uploaded_by: string | null
          file_url: string | null
          filing_number: string | null
          filing_subtype: string | null
          filing_title: string | null
          filing_type: string
          id: string
          notes: string | null
          prepared_by: string | null
          prepared_date: string | null
          status: string
          status_notes: string | null
          status_update_date: string | null
          submission_date: string | null
          submitted_to: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          case_id: string
          court_filing_date?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          draft_file_url?: string | null
          draft_uploaded_at?: string | null
          draft_uploaded_by?: string | null
          file_url?: string | null
          filing_number?: string | null
          filing_subtype?: string | null
          filing_title?: string | null
          filing_type: string
          id?: string
          notes?: string | null
          prepared_by?: string | null
          prepared_date?: string | null
          status?: string
          status_notes?: string | null
          status_update_date?: string | null
          submission_date?: string | null
          submitted_to?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          case_id?: string
          court_filing_date?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          draft_file_url?: string | null
          draft_uploaded_at?: string | null
          draft_uploaded_by?: string | null
          file_url?: string | null
          filing_number?: string | null
          filing_subtype?: string | null
          filing_title?: string | null
          filing_type?: string
          id?: string
          notes?: string | null
          prepared_by?: string | null
          prepared_date?: string | null
          status?: string
          status_notes?: string | null
          status_update_date?: string | null
          submission_date?: string | null
          submitted_to?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "filings_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filings_draft_uploaded_by_fkey"
            columns: ["draft_uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filings_prepared_by_fkey"
            columns: ["prepared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_module_permissions: {
        Row: {
          can_approve: boolean
          can_create: boolean
          can_delete: boolean
          can_export: boolean
          can_print: boolean
          can_read: boolean
          can_update: boolean
          created_at: string
          group_id: string
          id: string
          module_id: string
          updated_at: string
        }
        Insert: {
          can_approve?: boolean
          can_create?: boolean
          can_delete?: boolean
          can_export?: boolean
          can_print?: boolean
          can_read?: boolean
          can_update?: boolean
          created_at?: string
          group_id: string
          id?: string
          module_id: string
          updated_at?: string
        }
        Update: {
          can_approve?: boolean
          can_create?: boolean
          can_delete?: boolean
          can_export?: boolean
          can_print?: boolean
          can_read?: boolean
          can_update?: boolean
          created_at?: string
          group_id?: string
          id?: string
          module_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_module_permissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_module_permissions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      group_scope_rules: {
        Row: {
          created_at: string
          department: string | null
          group_id: string
          id: string
          module_id: string
          region: string | null
          scope: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          group_id: string
          id?: string
          module_id: string
          region?: string | null
          scope?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          group_id?: string
          id?: string
          module_id?: string
          region?: string | null
          scope?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_scope_rules_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_scope_rules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      group_scope_rules_dedup_archive: {
        Row: {
          archive_reason: string
          archived_at: string
          created_at: string | null
          department: string | null
          group_id: string | null
          id: string | null
          module_id: string | null
          region: string | null
          scope: string | null
          updated_at: string | null
        }
        Insert: {
          archive_reason: string
          archived_at?: string
          created_at?: string | null
          department?: string | null
          group_id?: string | null
          id?: string | null
          module_id?: string | null
          region?: string | null
          scope?: string | null
          updated_at?: string | null
        }
        Update: {
          archive_reason?: string
          archived_at?: string
          created_at?: string | null
          department?: string | null
          group_id?: string | null
          id?: string | null
          module_id?: string | null
          region?: string | null
          scope?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      groups: {
        Row: {
          created_at: string
          description: string | null
          group_name: string
          id: string
          is_active: boolean
          is_system_group: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          group_name: string
          id?: string
          is_active?: boolean
          is_system_group?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          group_name?: string
          id?: string
          is_active?: boolean
          is_system_group?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      hearing_types: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      incoming_correspondence: {
        Row: {
          acknowledgement_date: string | null
          acknowledgement_number: string | null
          acknowledgement_sent: boolean
          case_id: string | null
          created_at: string
          description: string | null
          document_type: string
          file_url: string | null
          id: string
          received_by: string | null
          received_date: string
          reference_number: string
          source: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          acknowledgement_date?: string | null
          acknowledgement_number?: string | null
          acknowledgement_sent?: boolean
          case_id?: string | null
          created_at?: string
          description?: string | null
          document_type: string
          file_url?: string | null
          id?: string
          received_by?: string | null
          received_date?: string
          reference_number: string
          source: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          acknowledgement_date?: string | null
          acknowledgement_number?: string | null
          acknowledgement_sent?: boolean
          case_id?: string | null
          created_at?: string
          description?: string | null
          document_type?: string
          file_url?: string | null
          id?: string
          received_by?: string | null
          received_date?: string
          reference_number?: string
          source?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incoming_correspondence_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incoming_correspondence_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      land_parcels: {
        Row: {
          area_sqm: number | null
          case_id: string
          coordinates: Json | null
          created_at: string
          id: string
          location: string | null
          notes: string | null
          parcel_number: string
          survey_plan_url: string | null
        }
        Insert: {
          area_sqm?: number | null
          case_id: string
          coordinates?: Json | null
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          parcel_number: string
          survey_plan_url?: string | null
        }
        Update: {
          area_sqm?: number | null
          case_id?: string
          coordinates?: Json | null
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          parcel_number?: string
          survey_plan_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "land_parcels_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      lease_types: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      litigation_cost_history: {
        Row: {
          action: string
          change_reason: string | null
          changed_at: string
          changed_by: string | null
          cost_id: string
          field_changed: string | null
          id: string
          new_value: string | null
          old_value: string | null
          record_snapshot: Json | null
        }
        Insert: {
          action: string
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          cost_id: string
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          record_snapshot?: Json | null
        }
        Update: {
          action?: string
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          cost_id?: string
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          record_snapshot?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "litigation_cost_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "litigation_cost_history_cost_id_fkey"
            columns: ["cost_id"]
            isOneToOne: false
            referencedRelation: "litigation_costs"
            referencedColumns: ["id"]
          },
        ]
      }
      litigation_costs: {
        Row: {
          amount: number
          amount_paid: number
          approved_by: string | null
          case_id: string
          category_id: string | null
          cost_type: string
          created_at: string
          created_by: string | null
          currency: string
          date_incurred: string
          date_paid: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          id: string
          is_deleted: boolean
          payee_name: string | null
          payee_type: string | null
          payment_status: string
          reference_number: string | null
          responsible_authority: string | null
          responsible_unit: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount?: number
          amount_paid?: number
          approved_by?: string | null
          case_id: string
          category_id?: string | null
          cost_type: string
          created_at?: string
          created_by?: string | null
          currency?: string
          date_incurred?: string
          date_paid?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean
          payee_name?: string | null
          payee_type?: string | null
          payment_status?: string
          reference_number?: string | null
          responsible_authority?: string | null
          responsible_unit?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount?: number
          amount_paid?: number
          approved_by?: string | null
          case_id?: string
          category_id?: string | null
          cost_type?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          date_incurred?: string
          date_paid?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean
          payee_name?: string | null
          payee_type?: string | null
          payment_status?: string
          reference_number?: string | null
          responsible_authority?: string | null
          responsible_unit?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "litigation_costs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "litigation_costs_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "litigation_costs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "cost_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "litigation_costs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "litigation_costs_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "litigation_costs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matter_types: {
        Row: {
          code: string | null
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          module_key: string
          module_name: string
          route: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          module_key: string
          module_name: string
          route?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          module_key?: string
          module_name?: string
          route?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          case_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          link: string | null
          message: string
          priority: string
          read: boolean
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          link?: string | null
          message: string
          priority?: string
          read?: boolean
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          case_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          link?: string | null
          message?: string
          priority?: string
          read?: boolean
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_types: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      parties: {
        Row: {
          case_id: string
          contact_info: Json | null
          created_at: string
          id: string
          name: string
          party_type: string
          role: string
        }
        Insert: {
          case_id: string
          contact_info?: Json | null
          created_at?: string
          id?: string
          name: string
          party_type: string
          role: string
        }
        Update: {
          case_id?: string
          contact_info?: Json | null
          created_at?: string
          id?: string
          name?: string
          party_type?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "parties_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      priority_levels: {
        Row: {
          code: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          label: string
        }
        Insert: {
          code: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          label: string
        }
        Update: {
          code?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          label?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          department: string | null
          email: string | null
          employee_id: string | null
          full_name: string | null
          id: string
          job_title: string | null
          legacy_role: string | null
          phone: string | null
          region: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          department?: string | null
          email?: string | null
          employee_id?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          legacy_role?: string | null
          phone?: string | null
          region?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          department?: string | null
          email?: string | null
          employee_id?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          legacy_role?: string | null
          phone?: string | null
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recommendation_links: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          legal_case_id: string
          link_context: string | null
          link_type: string
          recommendation_id: string
          snapshot_data: Json | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          legal_case_id: string
          link_context?: string | null
          link_type?: string
          recommendation_id: string
          snapshot_data?: Json | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          legal_case_id?: string
          link_context?: string | null
          link_type?: string
          recommendation_id?: string
          snapshot_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_links_legal_case_id_fkey"
            columns: ["legal_case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      search_warrants: {
        Row: {
          applicant_informant: string | null
          case_id: string | null
          created_at: string
          created_by: string | null
          crime_report_number: string | null
          date_assigned_to_lawyer: string | null
          date_received: string | null
          dlpp_lawyer_in_carriage: string | null
          documents_to_provide: string | null
          id: string
          land_description: string | null
          land_file_reference: string | null
          legal_issue: string | null
          police_contact_details: string | null
          police_officer_name: string | null
          police_officer_rank: string | null
          received_by: string | null
          received_from: string | null
          remarks_comments: string | null
          respondent: string | null
          status: string
          title_file_reference: string | null
          updated_at: string
          updated_by: string | null
          warrant_number: string | null
          witness_statement_status: string | null
        }
        Insert: {
          applicant_informant?: string | null
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          crime_report_number?: string | null
          date_assigned_to_lawyer?: string | null
          date_received?: string | null
          dlpp_lawyer_in_carriage?: string | null
          documents_to_provide?: string | null
          id?: string
          land_description?: string | null
          land_file_reference?: string | null
          legal_issue?: string | null
          police_contact_details?: string | null
          police_officer_name?: string | null
          police_officer_rank?: string | null
          received_by?: string | null
          received_from?: string | null
          remarks_comments?: string | null
          respondent?: string | null
          status?: string
          title_file_reference?: string | null
          updated_at?: string
          updated_by?: string | null
          warrant_number?: string | null
          witness_statement_status?: string | null
        }
        Update: {
          applicant_informant?: string | null
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          crime_report_number?: string | null
          date_assigned_to_lawyer?: string | null
          date_received?: string | null
          dlpp_lawyer_in_carriage?: string | null
          documents_to_provide?: string | null
          id?: string
          land_description?: string | null
          land_file_reference?: string | null
          legal_issue?: string | null
          police_contact_details?: string | null
          police_officer_name?: string | null
          police_officer_rank?: string | null
          received_by?: string | null
          received_from?: string | null
          remarks_comments?: string | null
          respondent?: string | null
          status?: string
          title_file_reference?: string | null
          updated_at?: string
          updated_by?: string | null
          warrant_number?: string | null
          witness_statement_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_warrants_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_warrants_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_warrants_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_warrants_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      section_160_applications: {
        Row: {
          application_number: string | null
          case_id: string | null
          created_at: string
          created_by: string | null
          details: string | null
          filed_date: string | null
          hearing_date: string | null
          id: string
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          application_number?: string | null
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          filed_date?: string | null
          hearing_date?: string | null
          id?: string
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          application_number?: string | null
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          filed_date?: string | null
          hearing_date?: string | null
          id?: string
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "section_160_applications_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "section_160_applications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      section5_notices: {
        Row: {
          case_id: string | null
          created_at: string
          created_by: string | null
          details: string | null
          id: string
          issued_date: string | null
          notice_number: string | null
          response_deadline: string | null
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          id?: string
          issued_date?: string | null
          notice_number?: string | null
          response_deadline?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          id?: string
          issued_date?: string | null
          notice_number?: string | null
          response_deadline?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "section5_notices_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "section5_notices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sol_gen_officers: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      staff_migration_batches: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          batch_name: string
          id: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_description: string | null
          status: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          batch_name: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_description?: string | null
          status?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          batch_name?: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_description?: string | null
          status?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_migration_batches_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_migration_batches_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_migration_batches_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_migration_results: {
        Row: {
          action: string
          auth_user_id: string | null
          created_at: string
          created_by: string | null
          details: Json
          group_id: string | null
          id: string
          profile_id: string | null
          staging_id: string
        }
        Insert: {
          action: string
          auth_user_id?: string | null
          created_at?: string
          created_by?: string | null
          details?: Json
          group_id?: string | null
          id?: string
          profile_id?: string | null
          staging_id: string
        }
        Update: {
          action?: string
          auth_user_id?: string | null
          created_at?: string
          created_by?: string | null
          details?: Json
          group_id?: string | null
          id?: string
          profile_id?: string | null
          staging_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_migration_results_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_migration_results_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_migration_results_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_migration_results_staging_id_fkey"
            columns: ["staging_id"]
            isOneToOne: false
            referencedRelation: "staff_migration_staging"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_migration_staging: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          batch_id: string
          created_at: string
          department: string | null
          email: string | null
          employee_id: string | null
          full_name: string
          id: string
          job_title: string | null
          legacy_role: string | null
          migration_status: string
          phone: string | null
          region: string | null
          source_row_number: number | null
          target_auth_user_id: string | null
          target_group_name: string | null
          target_profile_id: string | null
          updated_at: string
          validation_errors: Json
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          batch_id: string
          created_at?: string
          department?: string | null
          email?: string | null
          employee_id?: string | null
          full_name: string
          id?: string
          job_title?: string | null
          legacy_role?: string | null
          migration_status?: string
          phone?: string | null
          region?: string | null
          source_row_number?: number | null
          target_auth_user_id?: string | null
          target_group_name?: string | null
          target_profile_id?: string | null
          updated_at?: string
          validation_errors?: Json
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          batch_id?: string
          created_at?: string
          department?: string | null
          email?: string | null
          employee_id?: string | null
          full_name?: string
          id?: string
          job_title?: string | null
          legacy_role?: string | null
          migration_status?: string
          phone?: string | null
          region?: string | null
          source_row_number?: number | null
          target_auth_user_id?: string | null
          target_group_name?: string | null
          target_profile_id?: string | null
          updated_at?: string
          validation_errors?: Json
        }
        Relationships: [
          {
            foreignKeyName: "staff_migration_staging_applied_by_fkey"
            columns: ["applied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_migration_staging_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "staff_migration_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_migration_staging_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          case_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string
          id: string
          priority: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date: string
          id?: string
          priority?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string
          id?: string
          priority?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_groups: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          expires_at: string | null
          group_id: string
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          expires_at?: string | null
          group_id: string
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          expires_at?: string | null
          group_id?: string
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_groups_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_groups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      calendar_events: {
        Row: {
          auto_created: boolean | null
          case_id: string | null
          created_at: string | null
          description: string | null
          event_date: string | null
          event_type: string | null
          id: string | null
          location: string | null
          title: string | null
        }
        Insert: {
          auto_created?: boolean | null
          case_id?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          event_type?: string | null
          id?: string | null
          location?: string | null
          title?: string | null
        }
        Update: {
          auto_created?: boolean | null
          case_id?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          event_type?: string | null
          id?: string | null
          location?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      litigation_cost_documents: {
        Row: {
          cost_id: string | null
          description: string | null
          document_name: string | null
          document_type: string | null
          file_size: number | null
          file_url: string | null
          id: string | null
          mime_type: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          cost_id?: string | null
          description?: string | null
          document_name?: string | null
          document_type?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string | null
          mime_type?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          cost_id?: string | null
          description?: string | null
          document_name?: string | null
          document_type?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string | null
          mime_type?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_documents_cost_id_fkey"
            columns: ["cost_id"]
            isOneToOne: false
            referencedRelation: "litigation_costs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      apply_staff_migration_row: {
        Args: { p_staging_id: string }
        Returns: string
      }
      can_access_case: {
        Args: { p_action: string; p_case_id: string }
        Returns: boolean
      }
      current_user_has_permission: {
        Args: { p_action: string; p_module_key: string }
        Returns: boolean
      }
      current_user_id: { Args: never; Returns: string }
      current_user_is_admin: { Args: never; Returns: boolean }
      generate_intake_serial_number: { Args: never; Returns: string }
      get_user_permissions: {
        Args: { p_user_id: string }
        Returns: {
          can_approve: boolean
          can_create: boolean
          can_delete: boolean
          can_export: boolean
          can_print: boolean
          can_read: boolean
          can_update: boolean
          module_key: string
          module_name: string
        }[]
      }
      is_admin_user: { Args: { p_user_id: string }; Returns: boolean }
      is_valid_data_scope: { Args: { p_scope: string }; Returns: boolean }
      is_valid_permission_action: {
        Args: { p_action: string }
        Returns: boolean
      }
      link_recommendation_to_case: {
        Args: {
          p_legal_case_id: string
          p_link_context?: string
          p_link_type?: string
          p_recommendation_id: string
          p_snapshot_data?: Json
        }
        Returns: string
      }
      unlink_recommendation_from_case: {
        Args: { p_link_id: string; p_reason?: string }
        Returns: boolean
      }
      user_data_scope: {
        Args: { p_module_key: string; p_user_id: string }
        Returns: string
      }
      user_has_any_permission: {
        Args: { p_action: string; p_module_keys: string[]; p_user_id: string }
        Returns: boolean
      }
      user_has_permission: {
        Args: { p_action: string; p_module_key: string; p_user_id: string }
        Returns: boolean
      }
      user_has_permission_internal: {
        Args: { p_action: string; p_module_key: string; p_user_id: string }
        Returns: boolean
      }
      validate_staff_migration_batch: {
        Args: { p_batch_id: string }
        Returns: {
          migration_status: string
          staging_id: string
          validation_errors: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
