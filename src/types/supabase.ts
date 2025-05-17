
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
      resume_meta: {
        Row: {
          id: string;
          description: string | null;
          resume_pdf_url: string | null;
          updated_at: string;
        }
        Insert: {
          id: string;
          description?: string | null;
          resume_pdf_url?: string | null;
          updated_at?: string;
        }
        Update: {
          id?: string;
          description?: string | null;
          resume_pdf_url?: string | null;
          updated_at?: string;
        }
        Relationships: [];
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
          // created_at was removed here
        }
        Insert: {
          id?: string
          skill_name: string
          category_id?: string | null
        }
        Update: {
          id?: string
          skill_name?: string
          category_id?: string | null
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
      hero_content: {
        Row: {
          id: string;
          main_name: string | null;
          subtitles: string[] | null;
          social_github_url: string | null;
          social_linkedin_url: string | null;
          social_instagram_url: string | null;
          social_facebook_url: string | null;
          updated_at: string;
        }
        Insert: {
          id: string;
          main_name?: string | null;
          subtitles?: string[] | null;
          social_github_url?: string | null;
          social_linkedin_url?: string | null;
          social_instagram_url?: string | null;
          social_facebook_url?: string | null;
          updated_at?: string;
        }
        Update: {
          id?: string;
          main_name?: string | null;
          subtitles?: string[] | null;
          social_github_url?: string | null;
          social_linkedin_url?: string | null;
          social_instagram_url?: string | null;
          social_facebook_url?: string | null;
          updated_at?: string;
        }
        Relationships: [];
      }
      contact_page_details: {
        Row: {
          id: string;
          address: string | null;
          phone: string | null;
          phone_href: string | null;
          email: string | null;
          email_href: string | null;
          updated_at: string;
        }
        Insert: {
          id: string;
          address?: string | null;
          phone?: string | null;
          phone_href?: string | null;
          email?: string | null;
          email_href?: string | null;
          updated_at?: string;
        }
        Update: {
          id?: string;
          address?: string | null;
          phone?: string | null;
          phone_href?: string | null;
          email?: string | null;
          email_href?: string | null;
          updated_at?: string;
        }
        Relationships: [];
      }
      social_links: {
        Row: {
          id: string;
          label: string;
          icon_image_url: string | null;
          url: string;
          display_text: string | null;
          sort_order: number | null;
          created_at: string;
        }
        Insert: {
          id?: string;
          label: string;
          icon_image_url?: string | null;
          url: string;
          display_text?: string | null;
          sort_order?: number | null;
          created_at?: string;
        }
        Update: {
          id?: string;
          label?: string;
          icon_image_url?: string | null;
          url?: string;
          display_text?: string | null;
          sort_order?: number | null;
          created_at?: string;
        }
        Relationships: [];
      }
      contact_submissions: {
        Row: {
          id: string;
          name: string;
          email: string;
          subject: string | null;
          message: string;
          phone_number: string | null;
          status: string | null; // Should match SubmissionStatus type ('New', 'Replied', 'Archived')
          is_starred: boolean | null;
          submitted_at: string;
          notes: string | null;
        }
        Insert: {
          id?: string;
          name: string;
          email: string;
          subject?: string | null;
          message: string;
          phone_number?: string | null;
          status?: string | null;
          is_starred?: boolean | null;
          submitted_at?: string;
          notes?: string | null;
        }
        Update: {
          id?: string;
          name?: string;
          email?: string;
          subject?: string | null;
          message?: string;
          phone_number?: string | null;
          status?: string | null;
          is_starred?: boolean | null;
          submitted_at?: string;
          notes?: string | null;
        }
        Relationships: [];
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
  imageUrl: string | null; // Mapped from image_url
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
  iconImageUrl: string | null; // Mapped from icon_image_url
  description: string | null;
  categoryId?: string | null; // Foreign key
  created_at: string; // Added back as per schema
}

export interface SkillCategory {
  id: string;
  name: string;
  iconImageUrl?: string | null; // Mapped from icon_image_url
  skills?: Skill[];
  sort_order?: number | null;
  created_at?: string;
}

export type TimelineEventType = 'work' | 'education' | 'certification' | 'milestone';

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  iconImageUrl: string | null; // Mapped from icon_image_url
  type: TimelineEventType;
  sort_order?: number | null;
  created_at?: string;
}

export interface Certification {
  id: string;
  title: string;
  issuer: string;
  date: string;
  imageUrl: string | null; // Mapped from image_url
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
  imageUrl: string | null; // Mapped from image_url
  image_tagline: string | null;
  updated_at?: string;
}

export interface ResumeMeta {
  id: string;
  description: string | null;
  resume_pdf_url: string | null;
  updated_at: string;
}

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
  // No created_at for individual skills based on schema
}

export interface ResumeKeySkillCategory {
  id: string;
  category_name: string;
  icon_image_url: string | null;
  skills?: ResumeKeySkill[]; // Nested skills
  sort_order?: number | null;
  created_at: string;
}

export interface ResumeLanguage {
  id: string;
  language_name: string;
  proficiency: string | null;
  icon_image_url: string | null;
  sort_order?: number | null;
  created_at: string;
}

export interface HeroContent {
  id: string;
  main_name: string | null;
  subtitles: string[] | null;
  social_github_url: string | null;
  social_linkedin_url: string | null;
  social_instagram_url: string | null;
  social_facebook_url: string | null;
  updated_at: string;
}

export interface ContactPageDetail {
  id: string;
  address: string | null;
  phone: string | null;
  phone_href: string | null;
  email: string | null;
  email_href: string | null;
  updated_at: string;
}

export interface SocialLink {
  id: string;
  label: string;
  icon_image_url: string | null; // Changed from icon_name
  url: string;
  display_text: string | null;
  sort_order?: number | null;
  created_at: string;
}

export type SubmissionStatus = 'New' | 'Replied' | 'Archived';

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  phone_number: string | null;
  status?: SubmissionStatus | null; // Use the defined type
  is_starred?: boolean | null;
  submitted_at: string;
  notes?: string | null;
}

// Ensure the Database interface aligns with these specific types.
// For example, skills.Row should have icon_image_url, not icon_name.
// certifications.Row should not have image_hint if we removed it.
// timeline_events.Row should have icon_image_url.
// resume tables should have icon_image_url where applicable.
// social_links.Row should have icon_image_url.
// contact_submissions.Row.status should ideally be typed against SubmissionStatus enum if possible in DB or validated against it.
// Make sure resume_key_skills.Row does not have created_at
