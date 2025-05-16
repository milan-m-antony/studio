
// Based on your Supabase table structure
// This file helps provide TypeScript types for your Supabase data.

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
          icon_image_url: string | null
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
          icon_image_url: string | null
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
          verify_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          issuer: string
          date: string
          image_url?: string | null
          verify_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          issuer?: string
          date?: string
          image_url?: string | null
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
          icon_image_url: string | null
          type: string
          sort_order: number | null
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          title: string
          description: string
          icon_image_url?: string | null
          type: string
          sort_order?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          title?: string
          description?: string
          icon_image_url?: string | null
          type?: string
          sort_order?: number | null
          created_at?: string
        }
        Relationships: []
      }
      about_content: {
        Row: {
          id: string
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
          id: string
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
      resume_experience: {
        Row: {
          id: string
          job_title: string
          company_name: string
          date_range: string | null
          description_points: string[] | null
          icon_image_url: string | null
          sort_order: number | null
          created_at: string
        }
        Insert: {
          id?: string
          job_title: string
          company_name: string
          date_range?: string | null
          description_points?: string[] | null
          icon_image_url?: string | null
          sort_order?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          job_title?: string
          company_name?: string
          date_range?: string | null
          description_points?: string[] | null
          icon_image_url?: string | null
          sort_order?: number | null
          created_at?: string
        }
        Relationships: []
      }
      resume_education: {
        Row: {
          id: string
          degree_or_certification: string
          institution_name: string
          date_range: string | null
          description: string | null
          icon_image_url: string | null
          sort_order: number | null
          created_at: string
        }
        Insert: {
          id?: string
          degree_or_certification: string
          institution_name: string
          date_range?: string | null
          description?: string | null
          icon_image_url?: string | null
          sort_order?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          degree_or_certification?: string
          institution_name?: string
          date_range?: string | null
          description?: string | null
          icon_image_url?: string | null
          sort_order?: number | null
          created_at?: string
        }
        Relationships: []
      }
      resume_key_skill_categories: {
        Row: {
          id: string
          category_name: string
          icon_image_url: string | null
          sort_order: number | null
          created_at: string
        }
        Insert: {
          id?: string
          category_name: string
          icon_image_url?: string | null
          sort_order?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          category_name?: string
          icon_image_url?: string | null
          sort_order?: number | null
          created_at?: string
        }
        Relationships: []
      }
      resume_key_skills: {
        Row: {
          id: string
          skill_name: string
          category_id: string | null
          // created_at column removed to match SQL schema
        }
        Insert: {
          id?: string
          skill_name: string
          category_id?: string | null
          // created_at?: string // Removed
        }
        Update: {
          id?: string
          skill_name?: string
          category_id?: string | null
          // created_at?: string // Removed
        }
        Relationships: [
          {
            foreignKeyName: "resume_key_skills_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "resume_key_skill_categories"
            referencedColumns: ["id"]
          }
        ]
      }
      resume_languages: {
        Row: {
          id: string
          language_name: string
          proficiency: string | null
          icon_image_url: string | null
          sort_order: number | null
          created_at: string
        }
        Insert: {
          id?: string
          language_name: string
          proficiency?: string | null
          icon_image_url?: string | null
          sort_order?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          language_name?: string
          proficiency?: string | null
          icon_image_url?: string | null
          sort_order?: number | null
          created_at?: string
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
  created_at?: string; // Assuming skills might have created_at from their table
}

export interface SkillCategory {
  id: string;
  name: string;
  iconImageUrl?: string | null;
  skills?: Skill[];
  skillCount?: number;
  sort_order?: number | null;
  created_at?: string;
}

export type TimelineEventType = 'work' | 'education' | 'certification' | 'milestone';

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  iconImageUrl: string | null;
  type: TimelineEventType;
  sort_order?: number | null;
  created_at?: string;
}

export interface Certification {
  id: string;
  title: string;
  issuer: string;
  date: string;
  imageUrl: string | null;
  verifyUrl?: string | null;
  created_at: string;
}

export interface AboutContent {
  id: string;
  headline_main: string | null;
  headline_code_keyword: string | null;
  headline_connector: string | null;
  headline_creativity_keyword: string | null;
  paragraph1: string | null;
  paragraph2: string | null;
  paragraph3: string | null;
  imageUrl: string | null;
  image_tagline: string | null;
  updated_at?: string;
}

// Resume Section Types
export interface ResumeExperience {
  id: string;
  job_title: string;
  company_name: string;
  date_range: string | null;
  description_points: string[] | null;
  icon_image_url: string | null;
  sort_order?: number | null;
  created_at: string;
}

export interface ResumeEducation {
  id: string;
  degree_or_certification: string;
  institution_name: string;
  date_range: string | null;
  description: string | null;
  icon_image_url: string | null;
  sort_order?: number | null;
  created_at: string;
}

export interface ResumeKeySkill {
  id: string;
  skill_name: string;
  category_id?: string | null;
  // created_at field removed
}

export interface ResumeKeySkillCategory {
  id: string;
  category_name: string;
  icon_image_url: string | null;
  skills?: ResumeKeySkill[];
  sort_order?: number | null;
  created_at?: string;
}

export interface ResumeLanguage {
  id: string;
  language_name: string;
  proficiency: string | null;
  icon_image_url: string | null;
  sort_order?: number | null;
  created_at: string;
}
