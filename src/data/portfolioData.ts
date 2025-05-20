// This file is now primarily for static navigation links.
// Most data and types are now fetched from Supabase and defined in src/types/supabase.ts.

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

// IconMap and its direct Lucide imports (Lightbulb, Briefcase, etc.) are removed
// as TimelineItem.tsx now uses icon_image_url and its own SVG fallback.
// Other components import Lucide icons directly as needed.
