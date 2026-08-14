export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: string;
          avatar_url: string | null;
          current_level: string;
          learning_streak: number;
          hospital_id: string | null;
          sector: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          role?: string;
          avatar_url?: string | null;
          current_level?: string;
          learning_streak?: number;
          hospital_id?: string | null;
          sector?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          role?: string;
          avatar_url?: string | null;
          current_level?: string;
          learning_streak?: number;
          hospital_id?: string | null;
          sector?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      signs: {
        Row: {
          id: string;
          gloss: string;
          meaning: string;
          category_id: string;
          difficulty: string;
          region_note: string;
          steps: Json;
          video_url: string | null;
          image_url: string | null;
          is_published: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          gloss: string;
          meaning: string;
          category_id: string;
          difficulty?: string;
          region_note?: string;
          steps?: Json;
          video_url?: string | null;
          image_url?: string | null;
          is_published?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          gloss?: string;
          meaning?: string;
          category_id?: string;
          difficulty?: string;
          region_note?: string;
          steps?: Json;
          video_url?: string | null;
          image_url?: string | null;
          is_published?: boolean;
          created_at?: string;
        };
      };
      lessons: {
        Row: {
          id: string;
          slug: string;
          code: string;
          title: string;
          summary: string;
          category_id: string;
          duration_minutes: number;
          difficulty: string;
          thumbnail_tone: string;
          thumbnail_url: string | null;
          video_url: string | null;
          captions: Json;
          sign_ids: Json;
          quiz: Json;
          order_index: number;
          is_published: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          code: string;
          title: string;
          summary: string;
          category_id: string;
          duration_minutes?: number;
          difficulty?: string;
          thumbnail_tone?: string;
          thumbnail_url?: string | null;
          video_url?: string | null;
          captions?: Json;
          sign_ids?: Json;
          quiz?: Json;
          order_index?: number;
          is_published?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          code?: string;
          title?: string;
          summary?: string;
          category_id?: string;
          duration_minutes?: number;
          difficulty?: string;
          thumbnail_tone?: string;
          thumbnail_url?: string | null;
          video_url?: string | null;
          captions?: Json;
          sign_ids?: Json;
          quiz?: Json;
          order_index?: number;
          is_published?: boolean;
          created_at?: string;
        };
      };
      lesson_progress: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          progress_percent: number;
          completed: boolean;
          last_position: number;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          progress_percent?: number;
          completed?: boolean;
          last_position?: number;
          completed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          lesson_id?: string;
          progress_percent?: number;
          completed?: boolean;
          last_position?: number;
          completed_at?: string | null;
          updated_at?: string;
        };
      };
      assessments: {
        Row: {
          id: string;
          tier: string;
          title: string;
          duration_minutes: number;
          passing_score: number;
          created_at: string;
        };
        Insert: {
          id: string;
          tier: string;
          title: string;
          duration_minutes?: number;
          passing_score?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          tier?: string;
          title?: string;
          duration_minutes?: number;
          passing_score?: number;
          created_at?: string;
        };
      };
      assessment_questions: {
        Row: {
          id: string;
          assessment_id: string;
          prompt: string;
          kind: string;
          options: Json;
          answer: string;
          target_sign: string | null;
          hint: string | null;
          order_index: number;
        };
        Insert: {
          id: string;
          assessment_id: string;
          prompt: string;
          kind?: string;
          options?: Json;
          answer: string;
          target_sign?: string | null;
          hint?: string | null;
          order_index?: number;
        };
        Update: {
          id?: string;
          assessment_id?: string;
          prompt?: string;
          kind?: string;
          options?: Json;
          answer?: string;
          target_sign?: string | null;
          hint?: string | null;
          order_index?: number;
        };
      };
      assessment_results: {
        Row: {
          id: string;
          user_id: string;
          assessment_id: string;
          score: number;
          total: number;
          accuracy_percent: number;
          passed: boolean;
          tier: string;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          assessment_id: string;
          score: number;
          total: number;
          accuracy_percent: number;
          passed?: boolean;
          tier?: string;
          completed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          assessment_id?: string;
          score?: number;
          total?: number;
          accuracy_percent?: number;
          passed?: boolean;
          tier?: string;
          completed_at?: string;
        };
      };
      certificates: {
        Row: {
          id: string;
          user_id: string;
          tier: string;
          title: string;
          subtitle: string;
          certificate_number: string;
          score: number;
          status: string;
          issued_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tier: string;
          title?: string;
          subtitle?: string;
          certificate_number: string;
          score?: number;
          status?: string;
          issued_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tier?: string;
          title?: string;
          subtitle?: string;
          certificate_number?: string;
          score?: number;
          status?: string;
          issued_at?: string;
        };
      };
      achievements: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon: string;
          requirement: string | null;
        };
        Insert: {
          id: string;
          name: string;
          description: string;
          icon?: string;
          requirement?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          icon?: string;
          requirement?: string | null;
        };
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          earned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          earned_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_id?: string;
          earned_at?: string;
        };
      };
      hospitals: {
        Row: {
          id: string;
          name: string;
          city: string;
          state: string;
          readiness: string;
          departments_covered: number;
          departments_total: number;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          city: string;
          state: string;
          readiness?: string;
          departments_covered?: number;
          departments_total?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          city?: string;
          state?: string;
          readiness?: string;
          departments_covered?: number;
          departments_total?: number;
          created_at?: string;
        };
      };
      hospital_staff: {
        Row: {
          id: string;
          hospital_id: string;
          user_id: string | null;
          full_name: string;
          role: string;
          department: string;
          certification: string | null;
          progress_percent: number;
          status: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          hospital_id: string;
          user_id?: string | null;
          full_name: string;
          role: string;
          department: string;
          certification?: string | null;
          progress_percent?: number;
          status?: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          hospital_id?: string;
          user_id?: string | null;
          full_name?: string;
          role?: string;
          department?: string;
          certification?: string | null;
          progress_percent?: number;
          status?: string;
          joined_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  __InternalSupabase: {
    PostgresVersion: "15";
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
