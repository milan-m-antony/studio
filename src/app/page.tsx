// src/app/page.tsx
import { use } from 'react'; // Make sure 'use' is imported

// Re-import all section components
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

// This directive tells Next.js to render this page dynamically on every request.
export const dynamic = "force-dynamic";

const PRIMARY_HERO_CONTENT_ID = '00000000-0000-0000-0000-000000000004'; // Ensure this is your correct fixed ID

async function getHeroContentData(): Promise<HeroContent | null> {
  console.log('[HomePage] Attempting to fetch hero content...');
  try {
    const { data, error, status } = await supabase
      .from('hero_content')
      .select('id, main_name, subtitles, social_media_links, updated_at')
      .eq('id', PRIMARY_HERO_CONTENT_ID)
      .maybeSingle();

    if (error) {
      console.error('[HomePage] Supabase error fetching hero_content:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        status: status,
      });
      return null;
    }

    if (!data) {
      console.warn(`[HomePage] No hero_content found for ID: ${PRIMARY_HERO_CONTENT_ID}`);
      return null;
    }

    console.log('[HomePage] Successfully fetched hero_content name:', data.main_name);
    console.log('[HomePage] Raw hero_content social_media_links from Supabase:', JSON.stringify(data.social_media_links));

    let mappedSocialLinks: HeroSocialLinkItem[] = [];
    if (data.social_media_links && Array.isArray(data.social_media_links)) {
      mappedSocialLinks = data.social_media_links.map((link: any, index: number) => { // Using 'any' for raw link from DB
        console.log(`[HomePage] Mapping social link ${index} from DB:`, JSON.stringify(link));
        // Defensive mapping: check for icon_image_url first, then fall back to icon_name if old data structure
        const iconUrl = link.icon_image_url || (link as StoredHeroSocialLink).icon_image_url || null;

        return {
          id: link.id || crypto.randomUUID(), // Use existing id if available, otherwise generate
          label: link.label || 'Social Link',
          url: link.url || '#',
          icon_image_url: iconUrl, // Mapped from either icon_image_url or icon_name
        };
      });
    } else if (data.social_media_links) {
      console.warn("[HomePage] hero_content.social_media_links is not an array:", data.social_media_links);
    }
    console.log('[HomePage] Mapped social_media_links for HeroSection:', JSON.stringify(mappedSocialLinks));


    return {
      ...data, // Spread the original data
      social_media_links: mappedSocialLinks, // Override with the correctly mapped version
    } as HeroContent; // Asserting as HeroContent which expects HeroSocialLinkItem[]

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
  console.log('[HomePage] Rendering HomePage. Hero content fetched (main_name):', heroContent?.main_name);
  if (heroContent?.social_media_links) {
    console.log('[HomePage] Mapped social_media_links for HeroSection (in HomePage render):', JSON.stringify(heroContent.social_media_links));
  }

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
