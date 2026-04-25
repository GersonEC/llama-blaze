/**
 * Supabase database types.
 *
 * Hand-written to match `migrations/0001_init.sql`. Shape follows the output of
 * `supabase gen types typescript` (v12+), so you can regenerate it with:
 *
 *   pnpm dlx supabase gen types typescript --project-id <your-project-ref> > src/lib/supabase/database.types.ts
 *
 * Keep the `__InternalSupabase` stanza and the `Relationships: []` on each table —
 * the current `@supabase/supabase-js` types expect them.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '12';
  };
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string;
          price_cents: number;
          currency: string;
          stock: number;
          images: string[];
          status: Database['public']['Enums']['product_status'];
          category: Database['public']['Enums']['product_category'] | null;
          discount_percentage: number | null;
          acquisition_cost_cents: number;
          shipping_cost_cents: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string;
          price_cents: number;
          currency?: string;
          stock?: number;
          images?: string[];
          status?: Database['public']['Enums']['product_status'];
          category?: Database['public']['Enums']['product_category'] | null;
          discount_percentage?: number | null;
          acquisition_cost_cents?: number;
          shipping_cost_cents?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string;
          price_cents?: number;
          currency?: string;
          stock?: number;
          images?: string[];
          status?: Database['public']['Enums']['product_status'];
          category?: Database['public']['Enums']['product_category'] | null;
          discount_percentage?: number | null;
          acquisition_cost_cents?: number;
          shipping_cost_cents?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          hex: string;
          stock: number;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          hex: string;
          stock?: number;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          name?: string;
          hex?: string;
          stock?: number;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_variants_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      product_purchases: {
        Row: {
          id: string;
          product_id: string;
          purchased_at: string;
          quantity: number;
          unit_cost_cents: number;
          shipping_cost_cents: number;
          currency: string;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          purchased_at?: string;
          quantity: number;
          unit_cost_cents: number;
          shipping_cost_cents?: number;
          currency?: string;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          purchased_at?: string;
          quantity?: number;
          unit_cost_cents?: number;
          shipping_cost_cents?: number;
          currency?: string;
          notes?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_purchases_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      reservations: {
        Row: {
          id: string;
          status: Database['public']['Enums']['reservation_status'];
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          pickup_notes: string;
          total_cents: number;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          status?: Database['public']['Enums']['reservation_status'];
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          pickup_notes?: string;
          total_cents: number;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          status?: Database['public']['Enums']['reservation_status'];
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string;
          pickup_notes?: string;
          total_cents?: number;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reservation_items: {
        Row: {
          id: string;
          reservation_id: string;
          product_id: string;
          variant_id: string | null;
          product_name_snapshot: string;
          product_slug_snapshot: string;
          variant_name_snapshot: string | null;
          variant_hex_snapshot: string | null;
          unit_price_cents_snapshot: number;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          reservation_id: string;
          product_id: string;
          variant_id?: string | null;
          product_name_snapshot: string;
          product_slug_snapshot: string;
          variant_name_snapshot?: string | null;
          variant_hex_snapshot?: string | null;
          unit_price_cents_snapshot: number;
          quantity: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          reservation_id?: string;
          product_id?: string;
          variant_id?: string | null;
          product_name_snapshot?: string;
          product_slug_snapshot?: string;
          variant_name_snapshot?: string | null;
          variant_hex_snapshot?: string | null;
          unit_price_cents_snapshot?: number;
          quantity?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reservation_items_reservation_id_fkey';
            columns: ['reservation_id'];
            isOneToOne: false;
            referencedRelation: 'reservations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reservation_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reservation_items_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_reservation: {
        Args: { p_items: Json; p_customer: Json };
        Returns: string;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      record_product_purchase: {
        Args: {
          p_product_id: string;
          p_quantity: number;
          p_unit_cost_cents: number;
          p_shipping_cost_cents: number;
          p_purchased_at?: string | null;
          p_notes?: string | null;
        };
        Returns: string;
      };
      record_variant_purchase: {
        Args: {
          p_variant_id: string;
          p_quantity: number;
          p_unit_cost_cents: number;
          p_shipping_cost_cents: number;
          p_purchased_at?: string | null;
          p_notes?: string | null;
        };
        Returns: string;
      };
    };
    Enums: {
      reservation_status:
        | 'pending'
        | 'contacted'
        | 'confirmed'
        | 'completed'
        | 'cancelled';
      product_category:
        | 'abbigliamento'
        | 'scarpe'
        | 'borse'
        | 'accessori'
        | 'tech';
      product_status: 'active' | 'draft' | 'hidden';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

/** Ergonomic aliases — use these everywhere in repositories/mappers. */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
