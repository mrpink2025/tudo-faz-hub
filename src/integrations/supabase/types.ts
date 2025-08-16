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
      affiliate_clicks: {
        Row: {
          affiliate_link_id: string
          clicked_at: string
          converted: boolean | null
          id: string
          order_id: string | null
          referrer: string | null
          user_agent: string | null
          visitor_ip: unknown | null
        }
        Insert: {
          affiliate_link_id: string
          clicked_at?: string
          converted?: boolean | null
          id?: string
          order_id?: string | null
          referrer?: string | null
          user_agent?: string | null
          visitor_ip?: unknown | null
        }
        Update: {
          affiliate_link_id?: string
          clicked_at?: string
          converted?: boolean | null
          id?: string
          order_id?: string | null
          referrer?: string | null
          user_agent?: string | null
          visitor_ip?: unknown | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_affiliate_link_id_fkey"
            columns: ["affiliate_link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_commissions: {
        Row: {
          affiliate_id: string
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          listing_id: string
          order_amount: number
          order_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          commission_amount: number
          commission_rate: number
          created_at?: string
          id?: string
          listing_id: string
          order_amount: number
          order_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          listing_id?: string
          order_amount?: number
          order_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_links: {
        Row: {
          affiliate_id: string
          clicks_count: number | null
          created_at: string
          id: string
          last_clicked_at: string | null
          listing_id: string
          tracking_code: string
        }
        Insert: {
          affiliate_id: string
          clicks_count?: number | null
          created_at?: string
          id?: string
          last_clicked_at?: string | null
          listing_id: string
          tracking_code: string
        }
        Update: {
          affiliate_id?: string
          clicks_count?: number | null
          created_at?: string
          id?: string
          last_clicked_at?: string | null
          listing_id?: string
          tracking_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_links_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_requests: {
        Row: {
          affiliate_id: string
          created_at: string
          id: string
          listing_id: string
          message: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          id?: string
          listing_id: string
          message?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          message?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_requests_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_requests_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_withdrawals: {
        Row: {
          admin_notes: string | null
          affiliate_id: string
          amount: number
          bank_account: Json | null
          id: string
          pix_key: string | null
          processed_at: string | null
          requested_at: string
          status: string | null
        }
        Insert: {
          admin_notes?: string | null
          affiliate_id: string
          amount: number
          bank_account?: Json | null
          id?: string
          pix_key?: string | null
          processed_at?: string | null
          requested_at?: string
          status?: string | null
        }
        Update: {
          admin_notes?: string | null
          affiliate_id?: string
          amount?: number
          bank_account?: Json | null
          id?: string
          pix_key?: string | null
          processed_at?: string | null
          requested_at?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_withdrawals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          affiliate_code: string
          available_balance: number | null
          bank_account: Json | null
          created_at: string
          id: string
          pix_key: string | null
          status: string | null
          total_earnings: number | null
          updated_at: string
          user_id: string
          withdrawn_balance: number | null
        }
        Insert: {
          affiliate_code: string
          available_balance?: number | null
          bank_account?: Json | null
          created_at?: string
          id?: string
          pix_key?: string | null
          status?: string | null
          total_earnings?: number | null
          updated_at?: string
          user_id: string
          withdrawn_balance?: number | null
        }
        Update: {
          affiliate_code?: string
          available_balance?: number | null
          bank_account?: Json | null
          created_at?: string
          id?: string
          pix_key?: string | null
          status?: string | null
          total_earnings?: number | null
          updated_at?: string
          user_id?: string
          withdrawn_balance?: number | null
        }
        Relationships: []
      }
      analytics_dashboard: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          time_period: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          time_period: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          metric_value?: number
          time_period?: string
        }
        Relationships: []
      }
      auth_audit_log: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          ip_address: unknown | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name_pt: string
          name_zh: string | null
          parent_id: string | null
          position: number | null
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name_pt: string
          name_zh?: string | null
          parent_id?: string | null
          position?: number | null
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name_pt?: string
          name_zh?: string | null
          parent_id?: string | null
          position?: number | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number | null
          created_at: string
          credits: number
          currency: string | null
          id: string
          metadata: Json | null
          stripe_session_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          credits: number
          currency?: string | null
          id?: string
          metadata?: Json | null
          stripe_session_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          credits?: number
          currency?: string | null
          id?: string
          metadata?: Json | null
          stripe_session_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      listing_images: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          position: number
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          position?: number
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          position?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_locations: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string
          created_at: string
          id: string
          listing_id: string
          neighborhood: string | null
          state: string
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city: string
          created_at?: string
          id?: string
          listing_id: string
          neighborhood?: string | null
          state: string
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string
          created_at?: string
          id?: string
          listing_id?: string
          neighborhood?: string | null
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_locations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          affiliate_commission_rate: number | null
          affiliate_enabled: boolean
          approved: boolean | null
          category_id: string
          cover_image: string | null
          created_at: string
          currency: string | null
          description: string | null
          highlighted: boolean | null
          id: string
          lat: number | null
          lng: number | null
          location: string | null
          price: number | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          affiliate_commission_rate?: number | null
          affiliate_enabled?: boolean
          approved?: boolean | null
          category_id: string
          cover_image?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          highlighted?: boolean | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string | null
          price?: number | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          affiliate_commission_rate?: number | null
          affiliate_enabled?: boolean
          approved?: boolean | null
          category_id?: string
          cover_image?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          highlighted?: boolean | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string | null
          price?: number | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          affiliate_commission: number | null
          affiliate_id: string | null
          amount: number | null
          created_at: string
          currency: string | null
          id: string
          listing_id: string | null
          status: string | null
          stripe_session_id: string | null
          tracking_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          affiliate_commission?: number | null
          affiliate_id?: string | null
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          listing_id?: string | null
          status?: string | null
          stripe_session_id?: string | null
          tracking_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          affiliate_commission?: number | null
          affiliate_id?: string | null
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          listing_id?: string | null
          status?: string | null
          stripe_session_id?: string | null
          tracking_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          created_at: string
          id: string
          labels: Json
          metric_type: string
          timestamp: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          labels?: Json
          metric_type: string
          timestamp: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          labels?: Json
          metric_type?: string
          timestamp?: string
          value?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          email_confirmed_at: string | null
          full_name: string | null
          id: string
          last_sign_in_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          email_confirmed_at?: string | null
          full_name?: string | null
          id: string
          last_sign_in_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          email_confirmed_at?: string | null
          full_name?: string | null
          id?: string
          last_sign_in_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      push_notifications: {
        Row: {
          body: string
          created_at: string
          error_message: string | null
          id: string
          payload: Json | null
          sent_at: string | null
          status: string
          title: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          error_message?: string | null
          id?: string
          payload?: Json | null
          sent_at?: string | null
          status?: string
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          error_message?: string | null
          id?: string
          payload?: Json | null
          sent_at?: string | null
          status?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          active: boolean
          created_at: string
          id: string
          subscription: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          subscription: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          subscription?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          brand_accent: string | null
          brand_primary: string | null
          favicon_url: string | null
          hero_image_url: string | null
          id: number
          logo_url: string | null
          og_image_url: string | null
          promo_html: string | null
          site_name: string | null
          stripe_enabled: boolean | null
          stripe_publishable_key: string | null
          updated_at: string
        }
        Insert: {
          brand_accent?: string | null
          brand_primary?: string | null
          favicon_url?: string | null
          hero_image_url?: string | null
          id?: number
          logo_url?: string | null
          og_image_url?: string | null
          promo_html?: string | null
          site_name?: string | null
          stripe_enabled?: boolean | null
          stripe_publishable_key?: string | null
          updated_at?: string
        }
        Update: {
          brand_accent?: string | null
          brand_primary?: string | null
          favicon_url?: string | null
          hero_image_url?: string | null
          id?: number
          logo_url?: string | null
          og_image_url?: string | null
          promo_html?: string | null
          site_name?: string | null
          stripe_enabled?: boolean | null
          stripe_publishable_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      system_health: {
        Row: {
          checks: Json
          created_at: string
          id: string
          last_check: string
          response_time: number | null
          status: string
          updated_at: string
        }
        Insert: {
          checks?: Json
          created_at?: string
          id: string
          last_check?: string
          response_time?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          checks?: Json
          created_at?: string
          id?: string
          last_check?: string
          response_time?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      telemetry_events: {
        Row: {
          created_at: string
          event_data: Json
          event_type: string
          id: string
          session_id: string
          timestamp: string
          url: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json
          event_type: string
          id?: string
          session_id: string
          timestamp: string
          url: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json
          event_type?: string
          id?: string
          session_id?: string
          timestamp?: string
          url?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_message_reads: {
        Row: {
          conversation_user_id: string
          created_at: string
          id: string
          last_read_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_user_id: string
          created_at?: string
          id?: string
          last_read_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_user_id?: string
          created_at?: string
          id?: string
          last_read_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      listing_locations_public: {
        Row: {
          city: string | null
          listing_id: string | null
          neighborhood: string | null
          state: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_locations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings_public: {
        Row: {
          brand_accent: string | null
          brand_primary: string | null
          favicon_url: string | null
          hero_image_url: string | null
          logo_url: string | null
          og_image_url: string | null
          promo_html: string | null
          site_name: string | null
        }
        Insert: {
          brand_accent?: string | null
          brand_primary?: string | null
          favicon_url?: string | null
          hero_image_url?: string | null
          logo_url?: string | null
          og_image_url?: string | null
          promo_html?: string | null
          site_name?: string | null
        }
        Update: {
          brand_accent?: string | null
          brand_primary?: string | null
          favicon_url?: string | null
          hero_image_url?: string | null
          logo_url?: string | null
          og_image_url?: string | null
          promo_html?: string | null
          site_name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_telemetry_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_basic_profile_info: {
        Args: { profile_user_id: string }
        Returns: {
          avatar_url: string
          full_name: string
          user_id: string
        }[]
      }
      get_conversation_participants: {
        Args: { recipient: string; sender: string }
        Returns: {
          email: string
          full_name: string
          user_id: string
        }[]
      }
      get_conversations_with_last_message: {
        Args: { user_uuid: string }
        Returns: {
          last_message: string
          last_message_time: string
          other_user_email: string
          other_user_id: string
          other_user_name: string
          unread_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      listings_nearby: {
        Args: {
          p_lat: number
          p_limit?: number
          p_lng: number
          p_radius_km?: number
        }
        Returns: {
          cover_image: string
          created_at: string
          currency: string
          distance_km: number
          id: string
          lat: number
          lng: number
          location: string
          price: number
          title: string
        }[]
      }
      log_auth_event: {
        Args: {
          p_error_message?: string
          p_event_type: string
          p_ip_address?: unknown
          p_success?: boolean
          p_user_agent?: string
          p_user_id: string
        }
        Returns: undefined
      }
      mark_messages_as_read: {
        Args: { conversation_user: string }
        Returns: undefined
      }
      send_notification_email: {
        Args: { message: string; subject: string; user_email: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      order_status_type:
        | "pending"
        | "paid"
        | "canceled"
        | "in_analysis"
        | "approved"
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
      order_status_type: [
        "pending",
        "paid",
        "canceled",
        "in_analysis",
        "approved",
      ],
    },
  },
} as const
