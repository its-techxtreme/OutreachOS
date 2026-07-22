export type LeadStatus =
  | 'New'
  | 'Called'
  | 'No Answer'
  | 'Callback'
  | 'Replied'
  | 'Converted'
  | 'Archived';

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: {
          id: number;
          name: string;
          niche: string;
          country: string;
          phone: string | null;
          address: string | null;
          maps_url: string;
          status: LeadStatus;
          owner_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          niche: string;
          country: string;
          phone?: string | null;
          address?: string | null;
          maps_url: string;
          status?: LeadStatus;
          owner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          niche?: string;
          country?: string;
          phone?: string | null;
          address?: string | null;
          maps_url?: string;
          status?: LeadStatus;
          owner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      demo_sample_leads: {
        Row: {
          lead_id: number;
          selected_at: string;
        };
        Insert: {
          lead_id: number;
          selected_at?: string;
        };
        Update: {
          lead_id?: number;
          selected_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'demo_sample_leads_lead_id_fkey';
            columns: ['lead_id'];
            isOneToOne: true;
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          user_id: string;
          username: string;
          display_name: string | null;
          quest_board_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          username: string;
          display_name?: string | null;
          quest_board_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          username?: string;
          display_name?: string | null;
          quest_board_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          provider: 'razorpay';
          razorpay_customer_id: string | null;
          razorpay_subscription_id: string | null;
          plan_currency: 'INR' | 'USD';
          status: string;
          current_period_end: string | null;
          manual_override: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider?: 'razorpay';
          razorpay_customer_id?: string | null;
          razorpay_subscription_id?: string | null;
          plan_currency: 'INR' | 'USD';
          status?: string;
          current_period_end?: string | null;
          manual_override?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: 'razorpay';
          razorpay_customer_id?: string | null;
          razorpay_subscription_id?: string | null;
          plan_currency?: 'INR' | 'USD';
          status?: string;
          current_period_end?: string | null;
          manual_override?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      billing_webhook_events: {
        Row: {
          id: string;
          processed_at: string;
        };
        Insert: {
          id: string;
          processed_at?: string;
        };
        Update: {
          id?: string;
          processed_at?: string;
        };
        Relationships: [];
      };
      call_scripts: {
        Row: {
          id: number;
          user_id: string;
          script_key: string;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          script_key: string;
          body: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          script_key?: string;
          body?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_weekly_quests: {
        Row: {
          id: number;
          user_id: string;
          week_start: string;
          quest_id: string;
          progress: number;
          target: number;
          completed_at: string | null;
          claimed_manual: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          week_start: string;
          quest_id: string;
          progress?: number;
          target?: number;
          completed_at?: string | null;
          claimed_manual?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          week_start?: string;
          quest_id?: string;
          progress?: number;
          target?: number;
          completed_at?: string | null;
          claimed_manual?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_lead_status: {
        Row: {
          user_id: string;
          lead_id: number;
          status: LeadStatus;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          lead_id: number;
          status: LeadStatus;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          lead_id?: number;
          status?: LeadStatus;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      lookup_email_by_username: {
        Args: { p_username: string };
        Returns: string | null;
      };
      is_username_available: {
        Args: { p_username: string };
        Returns: boolean;
      };
      search_leads_fuzzy: {
        Args: {
          search_term: string;
          sim_threshold?: number;
          result_limit?: number;
          p_owner_id?: string | null;
        };
        Returns: Database['public']['Tables']['leads']['Row'][];
      };
      get_leads_filtered: {
        Args: {
          p_search?: string | null;
          p_niche?: string | null;
          p_country?: string | null;
          p_status?: string | null;
          p_start_date?: string | null;
          p_end_date?: string | null;
          p_page?: number;
          p_page_size?: number;
          p_owner_id?: string | null;
        };
        Returns: {
          leads: Database['public']['Tables']['leads']['Row'][];
          totalCount: number;
          page: number;
          pageSize: number;
        };
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Lead = Database['public']['Tables']['leads']['Row'];
export type LeadInsert = Database['public']['Tables']['leads']['Insert'];
export type LeadUpdate = Database['public']['Tables']['leads']['Update'];
