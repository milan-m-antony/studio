
// Based on your Supabase table structure
// This file helps provide TypeScript types for your Supabase data.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Interface for the structure stored in the JSONB column for Hero social links
export interface StoredHeroSocialLink {
  label: string;
  url: string;
  icon_image_url: string | null; // Changed from icon_name
}

// Interface for Hero social links when managed in client-side state (includes temporary id)
export interface HeroSocialLinkItem extends StoredHeroSocialLink {
  id: string; // Client-side temporary ID for list management
  iconImageUrl?: string | null; // Compatibility if needed, maps to icon_image_url
}

export interface AdminProfile {
  id: string;
  profile_photo_url: string | null;
  updated_at: string;
}

export interface SiteSettings {
  id: string; // 'global_settings'
  is_maintenance_mode_enabled: boolean;
  maintenance_message: string | null;
  is_analytics_tracking_enabled: boolean; // New field
  updated_at: string;
}

export interface AdminActivityLog {
  id: string;
  timestamp: string;
  user_identifier: string | null;
  action_type: string;
  description: string;
  details: Json | null;
  is_read: boolean;
}

export interface LegalDocument {
  id: string;
  title: string;
  content: string | null;
  updated_at: string;
}

export interface ProjectView {
    id: string;
    project_id: string | null;
    viewed_at: string;
    viewer_identifier: string | null;
}

export interface SkillInteraction {
  id: string;
  skill_id: string | null;
  interaction_type: string | null;
  interacted_at: string;
  viewer_identifier: string | null;
}

export interface ResumeDownload {
  id: string;
  downloaded_at: string;
  downloader_identifier: string | null;
}


export interface Database {
  public: {
    Tables: {
      admin_profile: {
        Row: AdminProfile
        Insert: Omit<AdminProfile, 'updated_at'> & { updated_at?: string; }
        Update: Partial<AdminProfile>
      }
      site_settings: {
        Row: SiteSettings
        Insert: Omit<SiteSettings, 'updated_at'> & { updated_at?: string; is_analytics_tracking_enabled?: boolean; }
        Update: Partial<SiteSettings> & { is_analytics_tracking_enabled?: boolean; }
      }
      admin_activity_log: {
        Row: AdminActivityLog
        Insert: Omit<AdminActivityLog, 'id' | 'timestamp' | 'is_read'> & { id?: string; timestamp?: string; is_read?: boolean; }
        Update: Partial<AdminActivityLog>
      }
      legal_documents: {
        Row: LegalDocument
        Insert: Omit<LegalDocument, 'updated_at'> & { updated_at?: string; }
        Update: Partial<LegalDocument>
      }
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
      }
      project_views: {
        Row: ProjectView
        Insert: {
          id?: string;
          project_id?: string | null;
          viewed_at?: string;
          viewer_identifier?: string | null;
        }
        Update: Partial<ProjectView>
      }
      skill_interactions: { 
        Row: SkillInteraction
        Insert: {
          id?: string;
          skill_id?: string | null;
          interaction_type?: string | null;
          interacted_at?: string;
          viewer_identifier?: string | null;
        }
        Update: Partial<SkillInteraction>
      }
      resume_downloads: { // New table for resume downloads
        Row: ResumeDownload
        Insert: {
          id?: string;
          downloaded_at?: string;
          downloader_identifier?: string | null;
        }
        Update: Partial<ResumeDownload>
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
      }
      skills: {
        Row: {
          id: string
          name: string
          icon_image_url: string | null
          description: string | null
          category_id: string | null
          created_at: string;
        }
        Insert: {
          id?: string
          name: string
          icon_image_url?: string | null
          description?: string | null
          category_id?: string | null
          created_at?: string;
        }
        Update: {
          id?: string
          name?: string
          icon_image_url?: string | null
          description?: string | null
          category_id?: string | null
          created_at?: string;
        }
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
      }
      about_content: { // Single row table
        Row: {
          id: string // Fixed ID e.g., '00000000-0000-0000-0000-000000000001'
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
        Insert: Omit<AboutContent, 'id' | 'updated_at'> & { id: string; updated_at?: string; }
        Update: Partial<Omit<AboutContent, 'id' | 'updated_at'>> & { updated_at?: string; }
      }
      resume_meta: { // Single row table
        Row: ResumeMeta
        Insert: Omit<ResumeMeta, 'id' | 'updated_at'> & { id: string; updated_at?: string; }
        Update: Partial<Omit<ResumeMeta, 'id' | 'updated_at'>> & { updated_at?: string; }
      }
      resume_experience: {
        Row: ResumeExperience
        Insert: Omit<ResumeExperience, 'id' | 'created_at'> & { id?: string; created_at?: string; }
        Update: Partial<Omit<ResumeExperience, 'id' | 'created_at'>>
      }
      resume_education: {
        Row: ResumeEducation
        Insert: Omit<ResumeEducation, 'id' | 'created_at'> & { id?: string; created_at?: string; }
        Update: Partial<Omit<ResumeEducation, 'id' | 'created_at'>>
      }
      resume_key_skill_categories: {
        Row: ResumeKeySkillCategory
        Insert: Omit<ResumeKeySkillCategory, 'id' | 'created_at'> & { id?: string; created_at?: string; }
        Update: Partial<Omit<ResumeKeySkillCategory, 'id' | 'created_at'>>
      }
      resume_key_skills: {
        Row: ResumeKeySkill
        Insert: Omit<ResumeKeySkill, 'id'> & { id?: string; } // No created_at
        Update: Partial<Omit<ResumeKeySkill, 'id'>>
      }
      resume_languages: {
        Row: ResumeLanguage
        Insert: Omit<ResumeLanguage, 'id' | 'created_at'> & { id?: string; created_at?: string; }
        Update: Partial<Omit<ResumeLanguage, 'id' | 'created_at'>>
      }
      hero_content: { // Single row table
        Row: HeroContent;
        Insert: Omit<HeroContent, 'id' | 'updated_at'> & { id: string; updated_at?: string; };
        Update: Partial<Omit<HeroContent, 'id' | 'updated_at'>> & { updated_at?: string; };
      }
      contact_page_details: { // Single row table
        Row: ContactPageDetail;
        Insert: Omit<ContactPageDetail, 'id' | 'updated_at'> & { id: string; updated_at?: string; };
        Update: Partial<Omit<ContactPageDetail, 'id' | 'updated_at'>> & { updated_at?: string; };
      }
      social_links: {
        Row: SocialLink;
        Insert: Omit<SocialLink, 'id' | 'created_at'> & { id?: string; created_at?: string; icon_image_url?: string | null };
        Update: Partial<Omit<SocialLink, 'id' | 'created_at'>>;
      }
      contact_submissions: {
        Row: ContactSubmission;
        Insert: Omit<ContactSubmission, 'id' | 'submitted_at' | 'status' | 'is_starred'> & { id?: string; submitted_at?: string; status?: SubmissionStatus | null; is_starred?: boolean | null; };
        Update: Partial<Omit<ContactSubmission, 'id'| 'submitted_at'>>;
      }
    } // End Tables
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
  liveDemoUrl?: string | null; // Mapped
  repoUrl?: string | null; // Mapped
  tags: string[] | null;
  status: ProjectStatus | null;
  progress?: number | null;
  created_at: string;
  // Raw DB fields (optional if you always map)
  image_url?: string | null;
  live_demo_url?: string | null;
  repo_url?: string | null;
}

export interface Skill {
  id: string;
  name: string;
  iconImageUrl: string | null; // Mapped from icon_image_url
  description: string | null;
  categoryId?: string | null; // Mapped
  created_at?: string;
  // Raw DB fields
  icon_image_url?: string | null;
  category_id?: string | null;
}

export interface SkillCategory {
  id: string;
  name: string;
  iconImageUrl?: string | null; // Mapped from icon_image_url
  skills?: Skill[]; // Nested skills
  sort_order?: number | null;
  created_at?: string;
  // Raw DB fields
  icon_image_url?: string | null;
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
  // Raw DB fields
  icon_image_url?: string | null;
}

export interface Certification {
  id: string;
  title: string;
  issuer: string;
  date: string;
  imageUrl: string | null; // Mapped
  verifyUrl?: string | null; // Mapped
  created_at?: string;
  // Raw DB fields
  image_url?: string | null;
  verify_url?: string | null;
}

export interface AboutContent { // For the single row in about_content
  id: string; // Fixed ID e.g., '00000000-0000-0000-0000-000000000001'
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
  // Raw DB fields
  image_url?: string | null;
}

export interface ResumeMeta {
  id: string; // Fixed ID e.g., '00000000-0000-0000-0000-000000000003'
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
  // created_at was removed from individual skills
}

export interface ResumeKeySkillCategory {
  id: string;
  category_name: string;
  icon_image_url: string | null;
  skills?: ResumeKeySkill[];
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

export interface HeroContent { // For the single row in hero_content
  id: string; // Fixed ID e.g., '00000000-0000-0000-0000-000000000004'
  main_name: string | null;
  subtitles: string[] | null;
  social_media_links: StoredHeroSocialLink[] | null; // Stored as JSONB
  updated_at: string;
}

export interface ContactPageDetail { // For the single row
  id: string; // Fixed ID e.g., '00000000-0000-0000-0000-000000000005'
  address: string | null;
  phone: string | null;
  phone_href: string | null;
  email: string | null;
  email_href: string | null;
  updated_at: string;
}

export interface SocialLink { // For social_links table (used in Contact Page)
  id: string;
  label: string;
  icon_image_url: string | null; // Mapped from icon_image_url
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
  status: SubmissionStatus | null;
  is_starred: boolean | null;
  submitted_at: string;
  notes?: string | null;
}

export type User = {
  id: string;
  email?: string;
  // Add other user properties from Supabase Auth if needed
};
