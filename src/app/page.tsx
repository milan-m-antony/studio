
// src/app/page.tsx
import { use } from 'react';
import HeroSection from '@/components/sections/HeroSection';
import AboutSection from '@/components/sections/AboutSection';
import ProjectsSection from '@/components/sections/ProjectsSection';
import SkillsSection from '@/components/sections/SkillsSection';
import TimelineSection from '@/components/sections/TimelineSection';
import CertificationsSection from '@/components/sections/CertificationsSection';
import ResumeSection from '@/components/sections/ResumeSection';
import ContactSection from '@/components/sections/ContactSection';
import { supabase } from '@/lib/supabaseClient';
import type { HeroContent, StoredHeroSocialLink, HeroSocialLinkItem } from '@/types/supabase';

export const dynamic = "force-dynamic";

const PRIMARY_HERO_CONTENT_ID = '00000000-0000-0000-0000-000000000004';

async function getHeroContentData(): Promise<HeroContent | null> {
  console.log('[HomePage] Attempting to fetch hero content...');
  try {
    const { data, error, status } = await supabase
      .from('hero_content')
      .select('id, main_name, subtitles, social_media_links, updated_at') // Ensure social_media_links is selected
      .eq('id', PRIMARY_HERO_CONTENT_ID)
      .maybeSingle();

    if (error) {
      console.error('[HomePage] Supabase error fetching hero_content:', { message: error.message, details: error.details, hint: error.hint, code: error.code, status });
      return null;
    }
    if (data) {
      console.log('[HomePage] Successfully fetched hero_content name:', data.main_name);
    } else {
      console.log('[HomePage] No hero_content found for ID, returning null.');
    }
    
    // Map StoredHeroSocialLink to HeroSocialLinkItem by adding a client-side id
    const mappedSocialLinks = data?.social_media_links?.map((link: StoredHeroSocialLink) => ({
        ...link,
        id: crypto.randomUUID(), // For client-side keying, not part of stored JSON
    })) || null;

    return data ? {
        id: data.id,
        main_name: data.main_name || null,
        subtitles: data.subtitles || null,
        social_media_links: mappedSocialLinks, // Use the mapped links
        updated_at: data.updated_at,
    } : null;
  } catch (e: any) {
    console.error('[HomePage] EXCEPTION fetching hero_content:', e.message, e);
    return null;
  }
}

interface HomePageProps {
  params?: { [key: string]: string | string[] | undefined };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function HomePage(props: HomePageProps) {
  // const resolvedParams = props.params ? use(props.params) : {};
  // const resolvedSearchParams = props.searchParams ? use(props.searchParams) : {};

  console.log('[HomePage] Starting to render HomePage component...');
  const heroContent = await getHeroContentData();
  console.log('[HomePage] Rendering HomePage. Hero content fetched (main_name):', heroContent?.main_name || "Not fetched/available");

  return (
    <>
      <HeroSection heroContent={heroContent} />
      <AboutSection />
      <ProjectsSection />
      <SkillsSection />
      <TimelineSection />
      <CertificationsSection />
      <ResumeSection />
      <ContactSection />
    </>
  );
}

    