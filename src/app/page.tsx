// src/app/page.tsx
import { use } from 'react';

// Temporarily comment out all section imports and dynamic data fetching
// import HeroSection from '@/components/sections/HeroSection';
// import AboutSection from '@/components/sections/AboutSection';
// import ProjectsSection from '@/components/sections/ProjectsSection';
// import SkillsSection from '@/components/sections/SkillsSection';
// import TimelineSection from '@/components/sections/TimelineSection';
// import CertificationsSection from '@/components/sections/CertificationsSection';
// import ResumeSection from '@/components/sections/ResumeSection';
// import ContactSection from '@/components/sections/ContactSection';
// import { supabase } from '@/lib/supabaseClient';
// import type { HeroContent, StoredHeroSocialLink, HeroSocialLinkItem } from '@/types/supabase';

export const dynamic = "force-dynamic"; // Keep this for now, can be removed if the minimal page works

// const PRIMARY_HERO_CONTENT_ID = '00000000-0000-0000-0000-000000000004';

// async function getHeroContentData(): Promise<HeroContent | null> {
//   console.log('[HomePage] Attempting to fetch hero content (currently simplified)...');
//   // Temporarily return null to bypass Supabase call for debugging
//   return null;
// }

interface HomePageProps {
  params?: { [key: string]: string | string[] | undefined };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function HomePage(props: HomePageProps) {
  // const resolvedParams = props.params ? use(props.params) : {}; // Can be removed for minimal test
  // const resolvedSearchParams = props.searchParams ? use(props.searchParams) : {}; // Can be removed for minimal test

  console.log('[HomePage] Rendering MINIMAL TEST version.');

  // const heroContent = use(getHeroContentData()); // Comment out data fetching
  // console.log('[HomePage] Minimal test - heroContent would be fetched here.');


  return (
    <div style={{ padding: '50px', textAlign: 'center', color: 'inherit', backgroundColor: 'inherit' }}>
      <h1>Homepage Minimal Test</h1>
      <p>If you see this, the basic page.tsx structure is rendering.</p>
      <p>Please check your Next.js server terminal for detailed error messages if the original page showed a 404.</p>
    </div>
    // <>
    //   <HeroSection heroContent={heroContent} />
    //   <AboutSection />
    //   <ProjectsSection />
    //   <SkillsSection />
    //   <TimelineSection />
    //   <CertificationsSection />
    //   <ResumeSection />
    //   <ContactSection />
    // </>
  );
}
