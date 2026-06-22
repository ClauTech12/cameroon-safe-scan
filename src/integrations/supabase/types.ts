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
      abuse_reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          report_id: string
          reporter_contact: string | null
          resolved: boolean
          submitter_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          report_id: string
          reporter_contact?: string | null
          resolved?: boolean
          submitter_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          report_id?: string
          reporter_contact?: string | null
          resolved?: boolean
          submitter_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "abuse_reports_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "scam_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      flagged_numbers: {
        Row: {
          created_at: string
          flagged_by: string | null
          id: string
          notes: string | null
          phone_number: string
          status: Database["public"]["Enums"]["flag_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          flagged_by?: string | null
          id?: string
          notes?: string | null
          phone_number: string
          status?: Database["public"]["Enums"]["flag_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          flagged_by?: string | null
          id?: string
          notes?: string | null
          phone_number?: string
          status?: Database["public"]["Enums"]["flag_status"]
          updated_at?: string
        }
        Relationships: []
      }
      report_rate_limits: {
        Row: {
          created_at: string
          id: string
          ip_hash: string
          phone_number: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_hash: string
          phone_number?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_hash?: string
          phone_number?: string | null
        }
        Relationships: []
      }
      scam_reports: {
        Row: {
          ai_advice: string[] | null
          ai_confidence: number | null
          contact_info: string | null
          created_at: string
          description: string
          id: string
          language: string
          location: string
          phone_number: string | null
          reporter_name: string | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          scam_type: Database["public"]["Enums"]["scam_type"]
          screenshot_url: string | null
          status: Database["public"]["Enums"]["report_status"]
          submitter_id: string | null
          updated_at: string
        }
        Insert: {
          ai_advice?: string[] | null
          ai_confidence?: number | null
          contact_info?: string | null
          created_at?: string
          description: string
          id?: string
          language?: string
          location: string
          phone_number?: string | null
          reporter_name?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          scam_type?: Database["public"]["Enums"]["scam_type"]
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          submitter_id?: string | null
          updated_at?: string
        }
        Update: {
          ai_advice?: string[] | null
          ai_confidence?: number | null
          contact_info?: string | null
          created_at?: string
          description?: string
          id?: string
          language?: string
          location?: string
          phone_number?: string | null
          reporter_name?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          scam_type?: Database["public"]["Enums"]["scam_type"]
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          submitter_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_first_admin: { Args: never; Returns: Json }
      get_user_email: { Args: { uid: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      jsonb_object_keys_count: { Args: { j: Json }; Returns: number }
      number_intel_summary: { Args: { _phone: string }; Returns: Json }
      phone_status: { Args: { _phone: string }; Returns: Json }
      report_explainability: { Args: { _report_id: string }; Returns: Json }
      top_reported_numbers: {
        Args: { _limit?: number }
        Returns: {
          dominant_type: Database["public"]["Enums"]["scam_type"]
          last_seen: string
          phone_number: string
          report_count: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      flag_status: "confirmed_scam" | "under_investigation" | "cleared"
      report_status: "pending" | "approved" | "rejected"
      risk_level: "low" | "medium" | "high"
      scam_type:
        | "mobile_money"
        | "job"
        | "phishing"
        | "investment"
        | "bank"
        | "other"
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
      app_role: ["admin", "moderator", "user"],
      flag_status: ["confirmed_scam", "under_investigation", "cleared"],
      report_status: ["pending", "approved", "rejected"],
      risk_level: ["low", "medium", "high"],
      scam_type: [
        "mobile_money",
        "job",
        "phishing",
        "investment",
        "bank",
        "other",
      ],
    },
  },
} as const
