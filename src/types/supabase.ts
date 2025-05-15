
// Based on your Supabase table structure
// This file helps provide TypeScript types for your Supabase data.
// You can generate these types automatically using the Supabase CLI:
// npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/types/supabase.ts

// For now, let's define some basic types based on the SQL provided earlier.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          title: string
          description: string | null
          image_url: string | null
          live_demo_url: string | null
          repo_url: string | null
          tags: string[] | null
          status: string | null
          progress: number | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          image_url?: string | null
          live_demo_url?: string | null
          repo_url?: string | null
          tags?: string[] | null
          status?: string | null
          progress?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          live_demo_url?: string | null
          repo_url?: string | null
          tags?: string[] | null
          status?: string | null
          progress?: number | null
          created_at?: string
        }
        Relationships: []
      }
      skill_categories: {
        Row: {
          id: string
          name: string
          icon_image_url: string | null // Changed from icon_name
          sort_order: number | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          icon_image_url?: string | null
          sort_order?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon_image_url?: string | null
          sort_order?: number | null
          created_at?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          id: string
          name: string
          icon_image_url: string | null // Changed from icon_name
          description: string | null
          category_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          icon_image_url?: string | null
          description?: string | null
          category_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon_image_url?: string | null
          description?: string | null
          category_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "skill_categories"
            referencedColumns: ["id"]
          }
        ]
      }
      certifications: {
        Row: {
          id: string
          title: string
          issuer: string
          date: string
          image_url: string | null
          image_hint: string | null
          verify_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          issuer: string
          date: string
          image_url?: string | null
          image_hint?: string | null
          verify_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          issuer?: string
          date?: string
          image_url?: string | null
          image_hint?: string | null
          verify_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      timeline_events: {
        Row: {
          id: string
          date: string
          title: string
          description: string
          icon_name: string
          type: string
          sort_order: number | null
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          title: string
          description: string
          icon_name: string
          type: string
          sort_order?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          title?: string
          description?: string
          icon_name?: string
          type?: string
          sort_order?: number | null
          created_at?: string
        }
        Relationships: []
      }
      about_content: { // New table for About Me section
        Row: {
          id: string // Should be a fixed UUID for the single entry
          headline_main: string | null
          headline_code_keyword: string | null
          headline_connector: string | null
          headline_creativity_keyword: string | null
          paragraph1: string | null
          paragraph2: string | null
          paragraph3: string | null
          image_url: string | null
          image_tagline: string | null
          updated_at: string
        }
        Insert: {
          id: string // Must be provided for upsert, or use a default if table allows
          headline_main?: string | null
          headline_code_keyword?: string | null
          headline_connector?: string | null
          headline_creativity_keyword?: string | null
          paragraph1?: string | null
          paragraph2?: string | null
          paragraph3?: string | null
          image_url?: string | null
          image_tagline?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          headline_main?: string | null
          headline_code_keyword?: string | null
          headline_connector?: string | null
          headline_creativity_keyword?: string | null
          paragraph1?: string | null
          paragraph2?: string | null
          paragraph3?: string | null
          image_url?: string | null
          image_tagline?: string | null
          updated_at?: string
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

export type ProjectStatus = 'Deployed' | 'In Progress' | 'Prototype' | 'Archived' | 'Concept' | 'Completed';

export interface Project {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  liveDemoUrl?: string | null;
  repoUrl?: string | null;
  tags: string[] | null;
  status: ProjectStatus | null;
  progress?: number | null;
  created_at: string;
}

export interface Skill {
  id: string;
  name: string;
  iconImageUrl: string | null;
  description: string | null;
  categoryId?: string | null;
}

export interface SkillCategory {
  id: string;
  name: string;
  iconImageUrl?: string | null;
  skills?: Skill[];
  skillCount?: number;
  sort_order?: number | null;
}

export type TimelineEventType = 'work' | 'education' | 'certification' | 'milestone';

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  iconName: string;
  type: TimelineEventType;
  sort_order?: number | null;
}

export interface Certification {
  id: string;
  title: string;
  issuer: string;
  date: string;
  imageUrl: string | null;
  imageHint: string | null;
  verifyUrl?: string | null;
  created_at: string;
}

// New type for About Content
export interface AboutContent {
  id: string; // This will be a fixed UUID
  headline_main: string | null;
  headline_code_keyword: string | null;
  headline_connector: string | null;
  headline_creativity_keyword: string | null;
  paragraph1: string | null;
  paragraph2: string | null;
  paragraph3: string | null;
  imageUrl: string | null; // Corresponds to image_url in DB
  image_tagline: string | null;
  updated_at?: string;
}
