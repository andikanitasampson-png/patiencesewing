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
      order_items: {
        Row: {
          color: string | null
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          size: string | null
          subtotal_ngn: number
          unit_price_ngn: number
        }
        Insert: {
          color?: string | null
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          size?: string | null
          subtotal_ngn: number
          unit_price_ngn: number
        }
        Update: {
          color?: string | null
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          size?: string | null
          subtotal_ngn?: number
          unit_price_ngn?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_type: string
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          notes: string | null
          paystack_reference: string | null
          paystack_status: string | null
          retailer_id: string | null
          shipping_address: string | null
          status: string
          total_ngn: number
        }
        Insert: {
          created_at?: string
          customer_type?: string
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          notes?: string | null
          paystack_reference?: string | null
          paystack_status?: string | null
          retailer_id?: string | null
          shipping_address?: string | null
          status?: string
          total_ngn: number
        }
        Update: {
          created_at?: string
          customer_type?: string
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          notes?: string | null
          paystack_reference?: string | null
          paystack_status?: string | null
          retailer_id?: string | null
          shipping_address?: string | null
          status?: string
          total_ngn?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_tiers: {
        Row: {
          id: string
          max_qty: number | null
          min_qty: number
          product_id: string
          unit_price_ngn: number
        }
        Insert: {
          id?: string
          max_qty?: number | null
          min_qty: number
          product_id: string
          unit_price_ngn: number
        }
        Update: {
          id?: string
          max_qty?: number | null
          min_qty?: number
          product_id?: string
          unit_price_ngn?: number
        }
        Relationships: [
          {
            foreignKeyName: "pricing_tiers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          colors: string[]
          compare_at_price_ngn: number | null
          created_at: string
          description: string | null
          fabric: string | null
          id: string
          images: string[]
          is_active: boolean
          moq: number
          name: string
          retail_price_ngn: number
          sizes: string[]
          videos: string[]
        }
        Insert: {
          category: string
          colors?: string[]
          compare_at_price_ngn?: number | null
          created_at?: string
          description?: string | null
          fabric?: string | null
          id?: string
          images?: string[]
          is_active?: boolean
          moq?: number
          name: string
          retail_price_ngn?: number
          sizes?: string[]
          videos?: string[]
        }
        Update: {
          category?: string
          colors?: string[]
          compare_at_price_ngn?: number | null
          created_at?: string
          description?: string | null
          fabric?: string | null
          id?: string
          images?: string[]
          is_active?: boolean
          moq?: number
          name?: string
          retail_price_ngn?: number
          sizes?: string[]
          videos?: string[]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          business_address: string | null
          business_name: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          monthly_volume: string | null
          phone: string | null
          retailer_status: string | null
          role: string
          social_links: Json | null
        }
        Insert: {
          business_address?: string | null
          business_name?: string | null
          created_at?: string
          email: string
          full_name?: string
          id: string
          monthly_volume?: string | null
          phone?: string | null
          retailer_status?: string | null
          role?: string
          social_links?: Json | null
        }
        Update: {
          business_address?: string | null
          business_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          monthly_volume?: string | null
          phone?: string | null
          retailer_status?: string | null
          role?: string
          social_links?: Json | null
        }
        Relationships: []
      }
      retailer_applications: {
        Row: {
          admin_notes: string | null
          business_address: string
          business_name: string
          email: string
          id: string
          monthly_volume: string | null
          owner_name: string
          phone: string
          social_links: Json | null
          status: string
          submitted_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          business_address: string
          business_name: string
          email: string
          id?: string
          monthly_volume?: string | null
          owner_name: string
          phone: string
          social_links?: Json | null
          status?: string
          submitted_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          business_address?: string
          business_name?: string
          email?: string
          id?: string
          monthly_volume?: string | null
          owner_name?: string
          phone?: string
          social_links?: Json | null
          status?: string
          submitted_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retailer_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_guest_order: {
        Args: { _email: string; _order_id: string }
        Returns: {
          created_at: string
          id: string
          notes: string
          paystack_reference: string
          paystack_status: string
          shipping_address: string
          status: string
          total_ngn: number
        }[]
      }
      get_guest_order_items: {
        Args: { _email: string; _order_id: string }
        Returns: {
          color: string
          id: string
          product_name: string
          quantity: number
          size: string
          subtotal_ngn: number
          unit_price_ngn: number
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
