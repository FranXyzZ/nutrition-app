// Tipos generados a partir de supabase/schema.sql
//
// Cuando tengas la Supabase CLI instalada y linkeada al
// proyecto, esto se puede regenerar automáticamente con:
//   npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
// Por ahora está escrito a mano, siguiendo el schema exacto.

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type Goal = "lose_fat" | "maintain" | "gain_muscle";
export type Sex = "male" | "female";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type AiProvider = "claude" | "openai" | "gemini" | "grok";
export type MessageRole = "user" | "assistant";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          age: number | null;
          sex: Sex | null;
          weight_kg: number | null;
          height_cm: number | null;
          activity_level: ActivityLevel | null;
          goal: Goal | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["profiles"]["Row"], "id">> & {
          id: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      macro_goals: {
        Row: {
          id: string;
          user_id: string;
          calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          is_custom: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["macro_goals"]["Row"],
          "id" | "created_at" | "updated_at"
        > & { id?: string };
        Update: Partial<Database["public"]["Tables"]["macro_goals"]["Row"]>;
        Relationships: [];
      };
      meals: {
        Row: {
          id: string;
          user_id: string;
          meal_type: MealType;
          logged_date: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["meals"]["Row"], "id" | "created_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["meals"]["Row"]>;
        Relationships: [];
      };
      food_entries: {
        Row: {
          id: string;
          user_id: string;
          meal_id: string;
          name: string;
          quantity: number;
          unit: string;
          calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          logged_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["food_entries"]["Row"],
          "id" | "created_at" | "updated_at"
        > & { id?: string };
        Update: Partial<Database["public"]["Tables"]["food_entries"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "food_entries_meal_id_fkey";
            columns: ["meal_id"];
            isOneToOne: false;
            referencedRelation: "meals";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_chats: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          provider: AiProvider;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["ai_chats"]["Row"],
          "id" | "created_at" | "updated_at"
        > & { id?: string };
        Update: Partial<Database["public"]["Tables"]["ai_chats"]["Row"]>;
        Relationships: [];
      };
      ai_messages: {
        Row: {
          id: string;
          chat_id: string;
          user_id: string;
          role: MessageRole;
          content: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["ai_messages"]["Row"],
          "id" | "created_at"
        > & { id?: string };
        Update: Partial<Database["public"]["Tables"]["ai_messages"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "ai_messages_chat_id_fkey";
            columns: ["chat_id"];
            isOneToOne: false;
            referencedRelation: "ai_chats";
            referencedColumns: ["id"];
          },
        ];
      };
      day_checkins: {
        Row: {
          id: string;
          user_id: string;
          checkin_date: string;
          ate_well: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["day_checkins"]["Row"],
          "id" | "created_at" | "updated_at"
        > & { id?: string };
        Update: Partial<Database["public"]["Tables"]["day_checkins"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
