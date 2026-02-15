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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          corrected_at: string | null
          correction: string | null
          correction_file_name: string | null
          correction_file_url: string | null
          created_at: string | null
          delivered_at: string | null
          delivery_date: string | null
          description: string | null
          due_date: string | null
          feedback: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          grade: number | null
          id: string
          response_file_name: string | null
          response_file_size: number | null
          response_file_type: string | null
          response_file_url: string | null
          status: string
          student_id: string
          student_response_file_name: string | null
          student_response_text: string | null
          teacher_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          corrected_at?: string | null
          correction?: string | null
          correction_file_name?: string | null
          correction_file_url?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_date?: string | null
          description?: string | null
          due_date?: string | null
          feedback?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          grade?: number | null
          id?: string
          response_file_name?: string | null
          response_file_size?: number | null
          response_file_type?: string | null
          response_file_url?: string | null
          status?: string
          student_id: string
          student_response_file_name?: string | null
          student_response_text?: string | null
          teacher_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          corrected_at?: string | null
          correction?: string | null
          correction_file_name?: string | null
          correction_file_url?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_date?: string | null
          description?: string | null
          due_date?: string | null
          feedback?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          grade?: number | null
          id?: string
          response_file_name?: string | null
          response_file_size?: number | null
          response_file_type?: string | null
          response_file_url?: string | null
          status?: string
          student_id?: string
          student_response_file_name?: string | null
          student_response_text?: string | null
          teacher_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_active_masked"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_masked"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_masked"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          action_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          action_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          action_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      class_logs: {
        Row: {
          attendance: boolean | null
          billed_amount: number | null
          class_date: string
          created_at: string | null
          duration_minutes: number | null
          end_at: string | null
          feedback: string | null
          grade: number | null
          id: string
          notes: string | null
          observations: string | null
          start_at: string | null
          student_id: string
          teacher_id: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          attendance?: boolean | null
          billed_amount?: number | null
          class_date: string
          created_at?: string | null
          duration_minutes?: number | null
          end_at?: string | null
          feedback?: string | null
          grade?: number | null
          id?: string
          notes?: string | null
          observations?: string | null
          start_at?: string | null
          student_id: string
          teacher_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          attendance?: boolean | null
          billed_amount?: number | null
          class_date?: string
          created_at?: string | null
          duration_minutes?: number | null
          end_at?: string | null
          feedback?: string | null
          grade?: number | null
          id?: string
          notes?: string | null
          observations?: string | null
          start_at?: string | null
          student_id?: string
          teacher_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_active_masked"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_masked"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_logs_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_logs_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_masked"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_record_class_logs: {
        Row: {
          class_log_id: string
          created_at: string | null
          financial_record_id: string
          id: string
        }
        Insert: {
          class_log_id: string
          created_at?: string | null
          financial_record_id: string
          id?: string
        }
        Update: {
          class_log_id?: string
          created_at?: string | null
          financial_record_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_record_class_logs_class_log_id_fkey"
            columns: ["class_log_id"]
            isOneToOne: false
            referencedRelation: "class_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_record_class_logs_class_log_id_fkey"
            columns: ["class_log_id"]
            isOneToOne: false
            referencedRelation: "class_logs_with_billing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_record_class_logs_financial_record_id_fkey"
            columns: ["financial_record_id"]
            isOneToOne: false
            referencedRelation: "class_logs_with_billing"
            referencedColumns: ["financial_record_id"]
          },
          {
            foreignKeyName: "financial_record_class_logs_financial_record_id_fkey"
            columns: ["financial_record_id"]
            isOneToOne: false
            referencedRelation: "financial_records"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_records: {
        Row: {
          amount: number
          class_log_id: string | null
          confirmed_by_user_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          paid_at: string | null
          payment_method: string | null
          status: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          class_log_id?: string | null
          confirmed_by_user_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          class_log_id?: string | null
          confirmed_by_user_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_records_class_log_id_fkey"
            columns: ["class_log_id"]
            isOneToOne: false
            referencedRelation: "class_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_class_log_id_fkey"
            columns: ["class_log_id"]
            isOneToOne: false
            referencedRelation: "class_logs_with_billing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_active_masked"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_masked"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      idempotency_keys: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          idempotency_key: string
          operation: string
          request_payload: Json | null
          response_payload: Json | null
          status: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          idempotency_key: string
          operation: string
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          idempotency_key?: string
          operation?: string
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      performance_logs: {
        Row: {
          created_at: string | null
          duration_ms: number
          id: string
          metadata: Json | null
          operation: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_ms: number
          id?: string
          metadata?: Json | null
          operation: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_ms?: number
          id?: string
          metadata?: Json | null
          operation?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          role: string
          student_id: string | null
          teacher_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          role: string
          student_id?: string | null
          teacher_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          role?: string
          student_id?: string | null
          teacher_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_active_masked"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_masked"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_masked"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          birth_date: string | null
          city: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          hourly_rate: number | null
          id: string
          is_deleted: boolean | null
          name: string
          origin: Database["public"]["Enums"]["student_origin"] | null
          pay_day: number | null
          phone: string | null
          state: string | null
          status: string | null
          teacher_id: string | null
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          hourly_rate?: number | null
          id?: string
          is_deleted?: boolean | null
          name: string
          origin?: Database["public"]["Enums"]["student_origin"] | null
          pay_day?: number | null
          phone?: string | null
          state?: string | null
          status?: string | null
          teacher_id?: string | null
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          hourly_rate?: number | null
          id?: string
          is_deleted?: boolean | null
          name?: string
          origin?: Database["public"]["Enums"]["student_origin"] | null
          pay_day?: number | null
          phone?: string | null
          state?: string | null
          status?: string | null
          teacher_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_masked"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          address: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          hourly_rate: number | null
          id: string
          name: string
          phone: string | null
          pix_key: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          hourly_rate?: number | null
          id?: string
          name: string
          phone?: string | null
          pix_key?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          hourly_rate?: number | null
          id?: string
          name?: string
          phone?: string | null
          pix_key?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      class_logs_with_billing: {
        Row: {
          attendance: boolean | null
          billed_amount: number | null
          class_date: string | null
          created_at: string | null
          duration_minutes: number | null
          end_at: string | null
          financial_amount: number | null
          financial_due_date: string | null
          financial_paid_at: string | null
          financial_record_id: string | null
          financial_status: string | null
          id: string | null
          is_package: boolean | null
          notes: string | null
          start_at: string | null
          student_id: string | null
          teacher_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_active_masked"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_masked"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_logs_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_logs_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_masked"
            referencedColumns: ["id"]
          },
        ]
      }
      students_active_masked: {
        Row: {
          birth_date: string | null
          city: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          hourly_rate: number | null
          id: string | null
          is_deleted: boolean | null
          name: string | null
          pay_day: number | null
          phone: string | null
          state: string | null
          status: string | null
          teacher_id: string | null
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          city?: string | null
          cpf?: never
          created_at?: string | null
          email?: string | null
          hourly_rate?: number | null
          id?: string | null
          is_deleted?: boolean | null
          name?: string | null
          pay_day?: number | null
          phone?: string | null
          state?: string | null
          status?: string | null
          teacher_id?: string | null
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          city?: string | null
          cpf?: never
          created_at?: string | null
          email?: string | null
          hourly_rate?: number | null
          id?: string | null
          is_deleted?: boolean | null
          name?: string | null
          pay_day?: number | null
          phone?: string | null
          state?: string | null
          status?: string | null
          teacher_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_masked"
            referencedColumns: ["id"]
          },
        ]
      }
      students_masked: {
        Row: {
          birth_date: string | null
          city: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          hourly_rate: number | null
          id: string | null
          is_deleted: boolean | null
          name: string | null
          pay_day: number | null
          phone: string | null
          state: string | null
          status: string | null
          teacher_id: string | null
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          city?: string | null
          cpf?: never
          created_at?: string | null
          email?: string | null
          hourly_rate?: number | null
          id?: string | null
          is_deleted?: boolean | null
          name?: string | null
          pay_day?: number | null
          phone?: string | null
          state?: string | null
          status?: string | null
          teacher_id?: string | null
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          city?: string | null
          cpf?: never
          created_at?: string | null
          email?: string | null
          hourly_rate?: number | null
          id?: string | null
          is_deleted?: boolean | null
          name?: string | null
          pay_day?: number | null
          phone?: string | null
          state?: string | null
          status?: string | null
          teacher_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_masked"
            referencedColumns: ["id"]
          },
        ]
      }
      students_with_stats: {
        Row: {
          birth_date: string | null
          city: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          hourly_rate: number | null
          id: string | null
          is_deleted: boolean | null
          name: string | null
          origin: Database["public"]["Enums"]["student_origin"] | null
          pay_day: number | null
          phone: string | null
          state: string | null
          status: string | null
          teacher_id: string | null
          total_activities_corrected: number | null
          total_activities_delivered: number | null
          total_activities_pending: number | null
          total_classes_attended: number | null
          total_classes_missed: number | null
          total_classes_pending: number | null
          total_paid_amount: number | null
          total_pending_amount: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_masked"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers_masked: {
        Row: {
          address: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          hourly_rate: number | null
          id: string | null
          name: string | null
          phone: string | null
          pix_key: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          cpf?: never
          created_at?: string | null
          email?: string | null
          hourly_rate?: number | null
          id?: string | null
          name?: string | null
          phone?: string | null
          pix_key?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          cpf?: never
          created_at?: string | null
          email?: string | null
          hourly_rate?: number | null
          id?: string | null
          name?: string | null
          phone?: string | null
          pix_key?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      confirm_payment_idempotent: {
        Args: { p_idempotency_key: string; p_record_id: string }
        Returns: Json
      }
      create_class_package: {
        Args: {
          p_class_logs: Database["public"]["CompositeTypes"]["class_log_input"][]
          p_financial_data: Database["public"]["CompositeTypes"]["package_financial_input"]
          p_idempotency_key?: string
        }
        Returns: Json
      }
      get_student_id: { Args: never; Returns: string }
      get_teacher_id: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_student: { Args: never; Returns: boolean }
      is_teacher: { Args: never; Returns: boolean }
      log_performance: {
        Args: { p_duration_ms: number; p_metadata?: Json; p_operation: string }
        Returns: undefined
      }
      mark_as_paid_idempotent: {
        Args: {
          p_idempotency_key: string
          p_payment_method: string
          p_record_id: string
        }
        Returns: Json
      }
      undo_payment_idempotent: {
        Args: { p_idempotency_key: string; p_record_id: string }
        Returns: Json
      }
    }
    Enums: {
      student_origin:
        | "indicacao"
        | "google"
        | "instagram"
        | "passante"
        | "outro"
    }
    CompositeTypes: {
      class_log_input: {
        student_id: string | null
        teacher_id: string | null
        class_date: string | null
        start_at: string | null
        end_at: string | null
        attendance: boolean | null
        notes: string | null
        billed_amount: number | null
      }
      package_financial_input: {
        amount: number | null
        due_date: string | null
        description: string | null
        payment_method: string | null
      }
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
    Enums: {
      student_origin: ["indicacao", "google", "instagram", "passante", "outro"],
    },
  },
} as const
