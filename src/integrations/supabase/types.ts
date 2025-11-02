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
      agent_permissions: {
        Row: {
          agent_id: string
          can_add_inspection_items: boolean | null
          can_create_inspections: boolean | null
          created_at: string
          damage: boolean | null
          id: string
          inspections: boolean | null
          inventory: boolean | null
          owner_id: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          can_add_inspection_items?: boolean | null
          can_create_inspections?: boolean | null
          created_at?: string
          damage?: boolean | null
          id?: string
          inspections?: boolean | null
          inventory?: boolean | null
          owner_id: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          can_add_inspection_items?: boolean | null
          can_create_inspections?: boolean | null
          created_at?: string
          damage?: boolean | null
          id?: string
          inspections?: boolean | null
          inventory?: boolean | null
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_permissions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_permissions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      damage_reports: {
        Row: {
          claim_number: string | null
          created_at: string
          damage_date: string
          description: string
          estimated_value: number | null
          id: string
          insurance_claim_filed: boolean | null
          location: string
          notes: string | null
          photo_urls: string[] | null
          property_name: string | null
          repair_completed: boolean | null
          repair_cost: number | null
          repair_date: string | null
          reported_by: string
          updated_at: string
          work_order_issued: boolean | null
          work_order_number: string | null
        }
        Insert: {
          claim_number?: string | null
          created_at?: string
          damage_date?: string
          description: string
          estimated_value?: number | null
          id?: string
          insurance_claim_filed?: boolean | null
          location: string
          notes?: string | null
          photo_urls?: string[] | null
          property_name?: string | null
          repair_completed?: boolean | null
          repair_cost?: number | null
          repair_date?: string | null
          reported_by: string
          updated_at?: string
          work_order_issued?: boolean | null
          work_order_number?: string | null
        }
        Update: {
          claim_number?: string | null
          created_at?: string
          damage_date?: string
          description?: string
          estimated_value?: number | null
          id?: string
          insurance_claim_filed?: boolean | null
          location?: string
          notes?: string | null
          photo_urls?: string[] | null
          property_name?: string | null
          repair_completed?: boolean | null
          repair_cost?: number | null
          repair_date?: string | null
          reported_by?: string
          updated_at?: string
          work_order_issued?: boolean | null
          work_order_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "damage_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_items: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_results: {
        Row: {
          created_at: string
          id: string
          inspection_id: string
          inspection_item_id: string
          notes: string | null
          photo_urls: string[] | null
          status: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          inspection_id: string
          inspection_item_id: string
          notes?: string | null
          photo_urls?: string[] | null
          status?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          inspection_id?: string
          inspection_item_id?: string
          notes?: string | null
          photo_urls?: string[] | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_results_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_results_inspection_item_id_fkey"
            columns: ["inspection_item_id"]
            isOneToOne: false
            referencedRelation: "inspection_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_types: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_custom: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_custom?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_custom?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_types_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          created_at: string
          due_date: string | null
          entered_by: string
          frequency_days: number | null
          frequency_type: string | null
          id: string
          inspection_date: string
          inspection_type_id: string
          next_due_date: string | null
          notes: string | null
          notification_days_ahead: number | null
          notification_method: string | null
          notifications_enabled: boolean | null
          performed_by: string | null
          property_name: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          entered_by: string
          frequency_days?: number | null
          frequency_type?: string | null
          id?: string
          inspection_date?: string
          inspection_type_id: string
          next_due_date?: string | null
          notes?: string | null
          notification_days_ahead?: number | null
          notification_method?: string | null
          notifications_enabled?: boolean | null
          performed_by?: string | null
          property_name?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          entered_by?: string
          frequency_days?: number | null
          frequency_type?: string | null
          id?: string
          inspection_date?: string
          inspection_type_id?: string
          next_due_date?: string | null
          notes?: string | null
          notification_days_ahead?: number | null
          notification_method?: string | null
          notifications_enabled?: boolean | null
          performed_by?: string | null
          property_name?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_inspection_type_id_fkey"
            columns: ["inspection_type_id"]
            isOneToOne: false
            referencedRelation: "inspection_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inspector_inspection_permissions: {
        Row: {
          granted_at: string
          granted_by: string
          id: string
          inspection_type_id: string
          inspector_id: string
        }
        Insert: {
          granted_at?: string
          granted_by: string
          id?: string
          inspection_type_id: string
          inspector_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string
          id?: string
          inspection_type_id?: string
          inspector_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspector_inspection_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspector_inspection_permissions_inspection_type_id_fkey"
            columns: ["inspection_type_id"]
            isOneToOne: false
            referencedRelation: "inspection_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspector_inspection_permissions_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_categories: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_predefined: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_predefined?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_predefined?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          amazon_image_url: string | null
          amazon_last_refreshed: string | null
          amazon_link: string | null
          amazon_title: string | null
          asin: string | null
          category_id: string
          cost_per_package: number | null
          created_at: string
          created_by: string | null
          current_quantity: number | null
          description: string | null
          id: string
          name: string
          notes: string | null
          reorder_link: string | null
          reorder_quantity: number | null
          restock_requested: boolean | null
          restock_threshold: number | null
          supplier: string | null
          unit: string | null
          unit_price: number | null
          units_per_package: number | null
          updated_at: string
        }
        Insert: {
          amazon_image_url?: string | null
          amazon_last_refreshed?: string | null
          amazon_link?: string | null
          amazon_title?: string | null
          asin?: string | null
          category_id: string
          cost_per_package?: number | null
          created_at?: string
          created_by?: string | null
          current_quantity?: number | null
          description?: string | null
          id?: string
          name: string
          notes?: string | null
          reorder_link?: string | null
          reorder_quantity?: number | null
          restock_requested?: boolean | null
          restock_threshold?: number | null
          supplier?: string | null
          unit?: string | null
          unit_price?: number | null
          units_per_package?: number | null
          updated_at?: string
        }
        Update: {
          amazon_image_url?: string | null
          amazon_last_refreshed?: string | null
          amazon_link?: string | null
          amazon_title?: string | null
          asin?: string | null
          category_id?: string
          cost_per_package?: number | null
          created_at?: string
          created_by?: string | null
          current_quantity?: number | null
          description?: string | null
          id?: string
          name?: string
          notes?: string | null
          reorder_link?: string | null
          reorder_quantity?: number | null
          restock_requested?: boolean | null
          restock_threshold?: number | null
          supplier?: string | null
          unit?: string | null
          unit_price?: number | null
          units_per_package?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_updates: {
        Row: {
          change_type: string
          created_at: string
          id: string
          item_id: string
          new_quantity: number
          notes: string | null
          previous_quantity: number
          updated_by: string
        }
        Insert: {
          change_type: string
          created_at?: string
          id?: string
          item_id: string
          new_quantity: number
          notes?: string | null
          previous_quantity: number
          updated_by: string
        }
        Update: {
          change_type?: string
          created_at?: string
          id?: string
          item_id?: string
          new_quantity?: number
          notes?: string | null
          previous_quantity?: number
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_updates_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_updates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string | null
          expires_at: string
          full_name: string
          id: string
          invitation_token: string
          owner_id: string
          permissions: Json
          phone: string | null
          role: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string
          full_name: string
          id?: string
          invitation_token?: string
          owner_id: string
          permissions?: Json
          phone?: string | null
          role?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string
          full_name?: string
          id?: string
          invitation_token?: string
          owner_id?: string
          permissions?: Json
          phone?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      Messages: {
        Row: {
          Content: string | null
          created_at: string
          id: number
          message_type: string | null
          recipient_id: string | null
          sender_id: string | null
          thread_id: string | null
          updated_at: string | null
        }
        Insert: {
          Content?: string | null
          created_at?: string
          id?: number
          message_type?: string | null
          recipient_id?: string | null
          sender_id?: string | null
          thread_id?: string | null
          updated_at?: string | null
        }
        Update: {
          Content?: string | null
          created_at?: string
          id?: number
          message_type?: string | null
          recipient_id?: string | null
          sender_id?: string | null
          thread_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string
          damage_notifications: boolean | null
          email_notifications: boolean | null
          id: string
          inspection_reminders: boolean | null
          inventory_alerts: boolean | null
          overdue_delay_days: number | null
          overdue_inspections: boolean | null
          sms_notifications: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          damage_notifications?: boolean | null
          email_notifications?: boolean | null
          id?: string
          inspection_reminders?: boolean | null
          inventory_alerts?: boolean | null
          overdue_delay_days?: number | null
          overdue_inspections?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          damage_notifications?: boolean | null
          email_notifications?: boolean | null
          id?: string
          inspection_reminders?: boolean | null
          inventory_alerts?: boolean | null
          overdue_delay_days?: number | null
          overdue_inspections?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email_addresses: string[] | null
          full_name: string
          id: string
          invited_by: string | null
          is_active: boolean | null
          phone_numbers: string[] | null
          preferred_contact_method: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_addresses?: string[] | null
          full_name: string
          id?: string
          invited_by?: string | null
          is_active?: boolean | null
          phone_numbers?: string[] | null
          preferred_contact_method?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_addresses?: string[] | null
          full_name?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean | null
          phone_numbers?: string[] | null
          preferred_contact_method?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
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
      get_current_user_profile: {
        Args: never
        Returns: {
          profile_id: string
          user_role: string
        }[]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: {
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      get_users_with_emails: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          profile_id: string
          user_id: string
        }[]
      }
      has_any_owner: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "manager" | "inspector"
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
      app_role: ["owner", "manager", "inspector"],
    },
  },
} as const
