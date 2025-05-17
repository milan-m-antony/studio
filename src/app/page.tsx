// src/app/page.tsx

// Temporarily comment out all imports to reduce potential side-effects
// import { use } from 'react';
// import HeroSection from '@/components/sections/HeroSection';
// import AboutSection from '@/components/sections/AboutSection';
// import ProjectsSection from '@/components/sections/ProjectsSection';
// import SkillsSection from '@/components/sections/SkillsSection';
// import TimelineSection from '@/components/sections/TimelineSection';
// import CertificationsSection from '@/components/sections/CertificationsSection';
// import ResumeSection from '@/components/sections/ResumeSection';
// import ContactSection from '@/components/sections/ContactSection';
// import { supabase } from '@/lib/supabaseClient';
// import type { HeroContent } from '@/types/supabase';

// export const dynamic = "force-dynamic"; // Temporarily comment out

// Define a simple interface for props, even if not used, to satisfy component signature
interface HomePageProps {
  params?: { [key: string]: string | string[] | undefined };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function HomePage(props: HomePageProps) {
  // Log that the component is attempting to render
  console.log('[HomePage] Minimal version rendering...');

  return (
    <div style={{ padding: '50px', textAlign: 'center', fontSize: '20px', color: 'inherit' }}>
      <h1>Minimal Page Test</h1>
      <p>If you see this, the basic page structure is rendering without server errors.</p>
      <p>Please check the Next.js server terminal output for detailed error messages if the HTTP 500 error persists.</p>
    </div>
  );
}
