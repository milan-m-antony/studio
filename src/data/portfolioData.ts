// This file is now primarily for static navigation links and potentially the IconMap
// for default icons if image URLs are not provided from Supabase.
// Most data and types are now fetched from Supabase and defined in src/types/supabase.ts.

import type { LucideIcon } from 'lucide-react';
import {
  Lightbulb, Briefcase, Award, GraduationCap, Laptop, Star,
} from 'lucide-react';

// navLinks remains as it's used by Header.tsx
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

// IconMap is potentially still used by TimelineItem.tsx for default icons
// if icon_image_url is not provided from Supabase.
export const IconMap: Record<string, LucideIcon> = {
  Lightbulb,
  Briefcase,
  Award,
  GraduationCap,
  Laptop,
  Star,
  // Add other Lucide icons here by name if needed as fallbacks
  // e.g. Code: CodeSquare, // Assuming CodeSquare is imported
};

// Removed unused data arrays:
// - projectsData
// - skillsData
// - timelineData (static version)
// - certificationsData (static version)

// Removed unused type definitions, they are now in src/types/supabase.ts:
// - Project
// - Skill
// - SkillCategory
// - TimelineEvent (original static type)
// - Certification (original static type)

// Removed re-export of LucideIcons, components should import directly.
