export type LeadStatus =
  | 'New'
  | 'Contacted'
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
    };
    Views: Record<string, never>;
    Functions: {
      search_leads_fuzzy: {
        Args: {
          search_term: string;
          sim_threshold?: number;
          result_limit?: number;
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
