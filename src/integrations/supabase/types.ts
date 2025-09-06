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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      analytics_summary: {
        Row: {
          attendance_percentage: number
          avg_rating: number | null
          event_id: string
          feedback_count: number
          id: string
          last_updated: string
          revenue: number | null
          total_attendance: number
          total_registrations: number
        }
        Insert: {
          attendance_percentage?: number
          avg_rating?: number | null
          event_id: string
          feedback_count?: number
          id?: string
          last_updated?: string
          revenue?: number | null
          total_attendance?: number
          total_registrations?: number
        }
        Update: {
          attendance_percentage?: number
          avg_rating?: number | null
          event_id?: string
          feedback_count?: number
          id?: string
          last_updated?: string
          revenue?: number | null
          total_attendance?: number
          total_registrations?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_summary_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          check_in_method: Database["public"]["Enums"]["check_in_method"]
          checked_in_at: string
          checked_out_at: string | null
          duration_minutes: number | null
          id: string
          registration_id: string
        }
        Insert: {
          check_in_method?: Database["public"]["Enums"]["check_in_method"]
          checked_in_at?: string
          checked_out_at?: string | null
          duration_minutes?: number | null
          id?: string
          registration_id: string
        }
        Update: {
          check_in_method?: Database["public"]["Enums"]["check_in_method"]
          checked_in_at?: string
          checked_out_at?: string | null
          duration_minutes?: number | null
          id?: string
          registration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: true
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      colleges: {
        Row: {
          address: string | null
          contact_email: string
          created_at: string
          domain: string
          id: string
          name: string
          settings: Json | null
        }
        Insert: {
          address?: string | null
          contact_email: string
          created_at?: string
          domain: string
          id?: string
          name: string
          settings?: Json | null
        }
        Update: {
          address?: string | null
          contact_email?: string
          created_at?: string
          domain?: string
          id?: string
          name?: string
          settings?: Json | null
        }
        Relationships: []
      }
      event_categories: {
        Row: {
          active: boolean
          color_code: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          color_code?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          color_code?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      event_tags: {
        Row: {
          category_id: string
          event_id: string
          id: string
        }
        Insert: {
          category_id: string
          event_id: string
          id?: string
        }
        Update: {
          category_id?: string
          event_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_tags_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_tags_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number
          college_id: string
          created_at: string
          created_by: string
          description: string | null
          event_date: string
          event_type: string
          id: string
          registration_deadline: string | null
          status: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at: string
          venue: string
        }
        Insert: {
          capacity?: number
          college_id: string
          created_at?: string
          created_by: string
          description?: string | null
          event_date: string
          event_type: string
          id?: string
          registration_deadline?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at?: string
          venue: string
        }
        Update: {
          capacity?: number
          college_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          registration_deadline?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          updated_at?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          anonymous: boolean
          comment: string | null
          feedback_date: string
          id: string
          rating: number
          registration_id: string
        }
        Insert: {
          anonymous?: boolean
          comment?: string | null
          feedback_date?: string
          id?: string
          rating: number
          registration_id: string
        }
        Update: {
          anonymous?: boolean
          comment?: string | null
          feedback_date?: string
          id?: string
          rating?: number
          registration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: true
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          event_id: string | null
          id: string
          message: string
          read_at: string | null
          sent_at: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          event_id?: string | null
          id?: string
          message: string
          read_at?: string | null
          sent_at?: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          event_id?: string | null
          id?: string
          message?: string
          read_at?: string | null
          sent_at?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          event_id: string
          id: string
          notes: string | null
          qr_code: string | null
          registration_date: string
          registration_status: Database["public"]["Enums"]["registration_status"]
          student_id: string
        }
        Insert: {
          event_id: string
          id?: string
          notes?: string | null
          qr_code?: string | null
          registration_date?: string
          registration_status?: Database["public"]["Enums"]["registration_status"]
          student_id: string
        }
        Update: {
          event_id?: string
          id?: string
          notes?: string | null
          qr_code?: string | null
          registration_date?: string
          registration_status?: Database["public"]["Enums"]["registration_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          college_id: string
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          profile_pic: string | null
          role: Database["public"]["Enums"]["user_role"]
          student_id: string | null
          user_id: string
        }
        Insert: {
          college_id: string
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          profile_pic?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          student_id?: string | null
          user_id: string
        }
        Update: {
          college_id?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          profile_pic?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          student_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_qr_code: {
        Args: { registration_id: string }
        Returns: string
      }
      update_event_analytics: {
        Args: { event_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      check_in_method: "qr_code" | "manual" | "mobile_app"
      event_status: "draft" | "published" | "cancelled" | "completed"
      notification_type:
        | "event_reminder"
        | "registration_confirmation"
        | "event_update"
        | "event_cancelled"
      registration_status: "pending" | "confirmed" | "cancelled" | "waitlisted"
      user_role: "admin" | "student"
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
      check_in_method: ["qr_code", "manual", "mobile_app"],
      event_status: ["draft", "published", "cancelled", "completed"],
      notification_type: [
        "event_reminder",
        "registration_confirmation",
        "event_update",
        "event_cancelled",
      ],
      registration_status: ["pending", "confirmed", "cancelled", "waitlisted"],
      user_role: ["admin", "student"],
    },
  },
} as const
