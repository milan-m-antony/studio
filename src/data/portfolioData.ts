
// This file is now largely superseded by data fetched from Supabase.
// We'll keep type definitions here or move them to a dedicated types file (e.g., src/types/supabase.ts)
// For now, we'll keep existing types and add Supabase-specific ones in src/types/supabase.ts
// The actual data arrays (projectsData, skillsData, etc.) will be removed or commented out
// as data will be fetched from Supabase.

import type { LucideIcon } from 'lucide-react';
import {
  Lightbulb, Briefcase, Award, GraduationCap, Laptop, Star,
  // Skill icons (will be mapped from names)
} from 'lucide-react';


// Original types - can be aligned with Supabase table structures
// export type ProjectStatus = 'Deployed' | 'In Progress' | 'Prototype' | 'Archived' | 'Concept' | 'Completed';

// export interface Project {
//   id: string;
//   title: string;
//   description: string;
//   imageUrl: string;
//   imageHint: string;
//   liveDemoUrl?: string;
//   repoUrl?: string;
//   tags: string[];
//   status: ProjectStatus;
//   progress?: number;
// }

// export interface Skill {
//   name: string;
//   icon: LucideIcon; // Will become iconName: string when fetched from DB
//   description: string;
// }

// export interface SkillCategory {
//   name: string;
//   icon: LucideIcon; // Will become iconName: string
//   iconColor?: string;
//   skills: Skill[];
// }


// export interface TimelineEvent {
//   id: string;
//   date: string;
//   title: string;
//   description: string;
//   iconName: keyof typeof IconMap; 
//   type: 'work' | 'education' | 'certification' | 'milestone';
// }

// const IconMap = {
//   Lightbulb,
//   Briefcase,
//   Award,
//   GraduationCap,
//   Laptop,
//   Star,
// };


// export interface Certification {
//   id: string;
//   title: string;
//   issuer: string;
//   date: string;
//   imageUrl: string;
//   imageHint: string;
//   verifyUrl?: string;
// }

// Data arrays are now commented out or removed as data comes from Supabase
// export const projectsData: Project[] = [ /* ... */ ];
// export const skillsData: SkillCategory[] = [ /* ... */ ];
// export const timelineData: TimelineEvent[] = [ /* ... */ ];
// export const certificationsData: Certification[] = [ /* ... */ ];


export const navLinks = [
  { href: "#hero", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#projects", label: "Projects" },
  { href: "#skills", label: "Skills" },
  { href: "#timeline", label: "Journey" },
  { href: "#certifications", label: "Certifications" },
  { href: "#resume", label: "Resume" },
  { href: "#contact", label: "Contact" },
];

// Keep IconMap for TimelineItem for now, or adapt TimelineItem to accept iconName string
export const IconMap = {
  Lightbulb,
  Briefcase,
  Award,
  GraduationCap,
  Laptop,
  Star,
};

// Placeholder for where all Lucide icons could be exported for dynamic use
// This is useful if icon names are stored in the DB for SkillCard/CategoryCard
import * as LucideIcons from 'lucide-react';
export { LucideIcons };
