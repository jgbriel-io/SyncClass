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
          class_date?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          end_at?: string | null
          feedback?: string | null
          grade?: number | null
          id?: string
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
            foreignKeyName: "class_logs_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_records: {
        Row: {
          amount: number
          class_log_id: string | null
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          paid_at: string | null
          payment_method: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          class_log_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          class_log_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_records_class_log_id_fkey"
            columns: ["class_log_id"]
            isOneToOne: true
            referencedRelation: "class_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          role: Database["public"]["Enums"]["app_role"] | null
          student_id: string | null
          teacher_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          role?: Database["public"]["Enums"]["app_role"] | null
          student_id?: string | null
          teacher_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          role?: Database["public"]["Enums"]["app_role"] | null
          student_id?: string | null
          teacher_id?: string | null
          updated_at?: string | null
          user_id?: string
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
            foreignKeyName: "profiles_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          birth_date: string | null
          city: string | null
          classes_per_week: number | null
          cpf: string | null
          created_at: string | null
          email: string | null
          hourly_rate: number | null
          id: string
          name: string
          origin: Database["public"]["Enums"]["student_origin"] | null
          pay_day: number | null
          phone: string | null
          state: string | null
          status: Database["public"]["Enums"]["student_status"] | null
          teacher_id: string | null
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          city?: string | null
          classes_per_week?: number | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          hourly_rate?: number | null
          id?: string
          name: string
          origin?: Database["public"]["Enums"]["student_origin"] | null
          pay_day?: number | null
          phone?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["student_status"] | null
          teacher_id?: string | null
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          city?: string | null
          classes_per_week?: number | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          hourly_rate?: number | null
          id?: string
          name?: string
          origin?: Database["public"]["Enums"]["student_origin"] | null
          pay_day?: number | null
          phone?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["student_status"] | null
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
        ]
      }
      teachers: {
        Row: {
          cpf: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["teacher_status"]
          updated_at: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["teacher_status"]
          updated_at?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["teacher_status"]
          updated_at?: string | null
        }
        Relationships: []
      }
      activities: {
        Row: {
          id: string
          student_id: string
          teacher_id: string
          title: string
          description: string | null
          file_url: string
          file_name: string
          file_type: string | null
          file_size: number | null
          status: string
          feedback: string | null
          grade: number | null
          correction_file_url: string | null
          correction_file_name: string | null
          created_at: string
          delivered_at: string | null
          corrected_at: string | null
          updated_at: string
          student_response_text: string | null
          student_response_file_url: string | null
          student_response_file_name: string | null
        }
        Insert: {
          id?: string
          student_id: string
          teacher_id: string
          title: string
          description?: string | null
          file_url: string
          file_name: string
          file_type?: string | null
          file_size?: number | null
          status?: string
          feedback?: string | null
          grade?: number | null
          correction_file_url?: string | null
          correction_file_name?: string | null
          created_at?: string
          delivered_at?: string | null
          corrected_at?: string | null
          updated_at?: string
          student_response_text?: string | null
          student_response_file_url?: string | null
          student_response_file_name?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          teacher_id?: string
          title?: string
          description?: string | null
          file_url?: string
          file_name?: string
          file_type?: string | null
          file_size?: number | null
          status?: string
          feedback?: string | null
          grade?: number | null
          correction_file_url?: string | null
          correction_file_name?: string | null
          created_at?: string
          delivered_at?: string | null
          corrected_at?: string | null
          updated_at?: string
          student_response_text?: string | null
          student_response_file_url?: string | null
          student_response_file_name?: string | null
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
            foreignKeyName: "activities_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          active: boolean
          email: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          active?: boolean
          email?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          active?: boolean
          email?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      class_logs_with_billing: {
        Row: {
          class_log_id: string
          student_id: string
          teacher_id: string | null
          class_date: string
          attendance: boolean | null
          title: string | null
          grade: number | null
          feedback: string | null
          created_at: string | null
          financial_record_id: string | null
          billed_amount: number | null
          billing_status: Database["public"]["Enums"]["payment_status"] | null
          billing_due_date: string | null
          billing_paid_at: string | null
          billing_status_consolidated: "not_billed" | "paid" | "pending" | "overdue" | "unknown"
          student_name: string | null
          teacher_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_cpf_exists_platform: { Args: { p_cpf_digits: string }; Returns: boolean }
      check_phone_exists_platform: { Args: { p_phone_digits: string }; Returns: boolean }
      get_my_student_id: { Args: never; Returns: string }
      get_my_teacher_id: { Args: never; Returns: string }
      set_user_role: {
        Args: {
          p_user_id: string
          p_role: Database["public"]["Enums"]["app_role"]
          p_full_name?: string | null
          p_email?: string | null
          p_teacher_id?: string | null
          p_student_id?: string | null
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_teacher: { Args: never; Returns: boolean }
      upsert_user_role_safe: {
        Args: {
          p_user_id: string
          p_role: Database["public"]["Enums"]["app_role"]
          p_full_name?: string | null
          p_email?: string | null
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "student" | "teacher"
      payment_status: "pendente" | "pago" | "atrasado"
      student_origin:
        | "indicacao"
        | "google"
        | "instagram"
        | "passante"
        | "outro"
      student_status: "ativo" | "inativo"
      teacher_status: "ativo" | "inativo"
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
    Enums: {
      app_role: ["admin", "student", "teacher"],
      payment_status: ["pendente", "pago", "atrasado"],
      student_origin: ["indicacao", "google", "instagram", "passante", "outro"],
      student_status: ["ativo", "inativo"],
      teacher_status: ["ativo", "inativo"],
    },
  },
} as const
