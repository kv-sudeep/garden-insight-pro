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
      diseases: {
        Row: {
          affects: string | null
          causes: string | null
          created_at: string
          id: string
          kind: string
          name: string
          organic_treatment: string | null
          pathogen: string | null
          prevention: string | null
          severity: string | null
          slug: string
          summary: string | null
          symptoms: string | null
          treatment: string | null
        }
        Insert: {
          affects?: string | null
          causes?: string | null
          created_at?: string
          id?: string
          kind?: string
          name: string
          organic_treatment?: string | null
          pathogen?: string | null
          prevention?: string | null
          severity?: string | null
          slug: string
          summary?: string | null
          symptoms?: string | null
          treatment?: string | null
        }
        Update: {
          affects?: string | null
          causes?: string | null
          created_at?: string
          id?: string
          kind?: string
          name?: string
          organic_treatment?: string | null
          pathogen?: string | null
          prevention?: string | null
          severity?: string | null
          slug?: string
          summary?: string | null
          symptoms?: string | null
          treatment?: string | null
        }
        Relationships: []
      }
      garden_plants: {
        Row: {
          acquired_on: string | null
          archived_at: string | null
          bed: string | null
          category: string | null
          created_at: string
          device_id: string
          id: string
          image_url: string | null
          last_scan_id: string | null
          location: string | null
          map_x: number | null
          map_y: number | null
          name: string
          nickname: string | null
          notes: string | null
          parent_plant_id: string | null
          retired_at: string | null
          retirement_note: string | null
          season_end_month: number | null
          season_start_month: number | null
          soil_type: string | null
          species: string | null
          tags: string[]
        }
        Insert: {
          acquired_on?: string | null
          archived_at?: string | null
          bed?: string | null
          category?: string | null
          created_at?: string
          device_id: string
          id?: string
          image_url?: string | null
          last_scan_id?: string | null
          location?: string | null
          map_x?: number | null
          map_y?: number | null
          name: string
          nickname?: string | null
          notes?: string | null
          parent_plant_id?: string | null
          retired_at?: string | null
          retirement_note?: string | null
          season_end_month?: number | null
          season_start_month?: number | null
          soil_type?: string | null
          species?: string | null
          tags?: string[]
        }
        Update: {
          acquired_on?: string | null
          archived_at?: string | null
          bed?: string | null
          category?: string | null
          created_at?: string
          device_id?: string
          id?: string
          image_url?: string | null
          last_scan_id?: string | null
          location?: string | null
          map_x?: number | null
          map_y?: number | null
          name?: string
          nickname?: string | null
          notes?: string | null
          parent_plant_id?: string | null
          retired_at?: string | null
          retirement_note?: string | null
          season_end_month?: number | null
          season_start_month?: number | null
          soil_type?: string | null
          species?: string | null
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "garden_plants_last_scan_id_fkey"
            columns: ["last_scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garden_plants_parent_plant_id_fkey"
            columns: ["parent_plant_id"]
            isOneToOne: false
            referencedRelation: "garden_plants"
            referencedColumns: ["id"]
          },
        ]
      }
      identifications: {
        Row: {
          also_known_as: string | null
          care_calendar: string | null
          common_mistakes: string | null
          common_name: string | null
          companion_plants: string | null
          confidence: number | null
          created_at: string
          device_id: string
          edible_parts: string | null
          family: string | null
          id: string
          image_url: string
          images: Json
          invasive_notes: string | null
          native_range: string | null
          raw: Json | null
          scientific_name: string | null
          similar_plants: string | null
          soil: string | null
          soil_ph: string | null
          summary: string | null
          sunlight: string | null
          toxicity: string | null
          water: string | null
        }
        Insert: {
          also_known_as?: string | null
          care_calendar?: string | null
          common_mistakes?: string | null
          common_name?: string | null
          companion_plants?: string | null
          confidence?: number | null
          created_at?: string
          device_id: string
          edible_parts?: string | null
          family?: string | null
          id?: string
          image_url: string
          images?: Json
          invasive_notes?: string | null
          native_range?: string | null
          raw?: Json | null
          scientific_name?: string | null
          similar_plants?: string | null
          soil?: string | null
          soil_ph?: string | null
          summary?: string | null
          sunlight?: string | null
          toxicity?: string | null
          water?: string | null
        }
        Update: {
          also_known_as?: string | null
          care_calendar?: string | null
          common_mistakes?: string | null
          common_name?: string | null
          companion_plants?: string | null
          confidence?: number | null
          created_at?: string
          device_id?: string
          edible_parts?: string | null
          family?: string | null
          id?: string
          image_url?: string
          images?: Json
          invasive_notes?: string | null
          native_range?: string | null
          raw?: Json | null
          scientific_name?: string | null
          similar_plants?: string | null
          soil?: string | null
          soil_ph?: string | null
          summary?: string | null
          sunlight?: string | null
          toxicity?: string | null
          water?: string | null
        }
        Relationships: []
      }
      pests: {
        Row: {
          affects: string | null
          created_at: string
          damage: string | null
          id: string
          identify: string | null
          lifecycle: string | null
          name: string
          organic_treatment: string | null
          prevention: string | null
          scientific_name: string | null
          slug: string
          summary: string | null
          treatment: string | null
        }
        Insert: {
          affects?: string | null
          created_at?: string
          damage?: string | null
          id?: string
          identify?: string | null
          lifecycle?: string | null
          name: string
          organic_treatment?: string | null
          prevention?: string | null
          scientific_name?: string | null
          slug: string
          summary?: string | null
          treatment?: string | null
        }
        Update: {
          affects?: string | null
          created_at?: string
          damage?: string | null
          id?: string
          identify?: string | null
          lifecycle?: string | null
          name?: string
          organic_treatment?: string | null
          prevention?: string | null
          scientific_name?: string | null
          slug?: string
          summary?: string | null
          treatment?: string | null
        }
        Relationships: []
      }
      plant_events: {
        Row: {
          cost: number | null
          created_at: string
          currency: string
          device_id: string
          effectiveness: number | null
          id: string
          kind: string
          note: string | null
          occurred_on: string
          plant_id: string
          product: string | null
          yield_amount: number | null
          yield_unit: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string
          currency?: string
          device_id: string
          effectiveness?: number | null
          id?: string
          kind: string
          note?: string | null
          occurred_on?: string
          plant_id: string
          product?: string | null
          yield_amount?: number | null
          yield_unit?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string
          currency?: string
          device_id?: string
          effectiveness?: number | null
          id?: string
          kind?: string
          note?: string | null
          occurred_on?: string
          plant_id?: string
          product?: string | null
          yield_amount?: number | null
          yield_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plant_events_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "garden_plants"
            referencedColumns: ["id"]
          },
        ]
      }
      plant_library: {
        Row: {
          avoid_near: string | null
          category: string | null
          common_diseases: string | null
          common_mistakes: string | null
          companion_plants: string | null
          created_at: string
          description: string | null
          edible_parts: string | null
          id: string
          image_url: string | null
          invasive_notes: string | null
          name: string
          native_range: string | null
          pronunciation: string | null
          scientific_name: string | null
          similar_plants: string | null
          soil: string | null
          soil_ph: string | null
          sunlight: string | null
          toxicity: string | null
          water: string | null
        }
        Insert: {
          avoid_near?: string | null
          category?: string | null
          common_diseases?: string | null
          common_mistakes?: string | null
          companion_plants?: string | null
          created_at?: string
          description?: string | null
          edible_parts?: string | null
          id?: string
          image_url?: string | null
          invasive_notes?: string | null
          name: string
          native_range?: string | null
          pronunciation?: string | null
          scientific_name?: string | null
          similar_plants?: string | null
          soil?: string | null
          soil_ph?: string | null
          sunlight?: string | null
          toxicity?: string | null
          water?: string | null
        }
        Update: {
          avoid_near?: string | null
          category?: string | null
          common_diseases?: string | null
          common_mistakes?: string | null
          companion_plants?: string | null
          created_at?: string
          description?: string | null
          edible_parts?: string | null
          id?: string
          image_url?: string | null
          invasive_notes?: string | null
          name?: string
          native_range?: string | null
          pronunciation?: string | null
          scientific_name?: string | null
          similar_plants?: string | null
          soil?: string | null
          soil_ph?: string | null
          sunlight?: string | null
          toxicity?: string | null
          water?: string | null
        }
        Relationships: []
      }
      plant_photos: {
        Row: {
          caption: string | null
          created_at: string
          device_id: string
          id: string
          image_url: string
          plant_id: string
          taken_at: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          device_id: string
          id?: string
          image_url: string
          plant_id: string
          taken_at?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          device_id?: string
          id?: string
          image_url?: string
          plant_id?: string
          taken_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plant_photos_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "garden_plants"
            referencedColumns: ["id"]
          },
        ]
      }
      scans: {
        Row: {
          confidence: number | null
          created_at: string
          device_id: string
          disease_name: string | null
          id: string
          image_hash: string | null
          image_url: string
          images: Json
          is_healthy: boolean | null
          organic_treatment: string | null
          plant_name: string | null
          prevention: string | null
          raw: Json | null
          severity: string | null
          shop_query: string | null
          symptoms: string | null
          treatment: string | null
          user_notes: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          device_id: string
          disease_name?: string | null
          id?: string
          image_hash?: string | null
          image_url: string
          images?: Json
          is_healthy?: boolean | null
          organic_treatment?: string | null
          plant_name?: string | null
          prevention?: string | null
          raw?: Json | null
          severity?: string | null
          shop_query?: string | null
          symptoms?: string | null
          treatment?: string | null
          user_notes?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          device_id?: string
          disease_name?: string | null
          id?: string
          image_hash?: string | null
          image_url?: string
          images?: Json
          is_healthy?: boolean | null
          organic_treatment?: string | null
          plant_name?: string | null
          prevention?: string | null
          raw?: Json | null
          severity?: string | null
          shop_query?: string | null
          symptoms?: string | null
          treatment?: string | null
          user_notes?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
