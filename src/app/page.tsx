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
      .select('id, main_name, subtitles, social_media_links, updated_at')
      .eq('id', PRIMARY_HERO_CONTENT_ID)
      .maybeSingle();

    if (error) {
      console.error('[HomePage] Supabase error fetching hero_content:', { message: error.message, details: error.details, hint: error.hint, code: error.code, status });
      return null;
    }
    if (!data) {
      console.log('[HomePage] No hero_content found for ID, returning null.');
      return null;
    }
    console.log('[HomePage] Successfully fetched hero_content name:', data.main_name);
    console.log('[HomePage] Raw hero_content social_media_links from Supabase:', JSON.stringify(data.social_media_links));


    let mappedSocialLinks: HeroSocialLinkItem[] | null = null;
    if (data.social_media_links && Array.isArray(data.social_media_links)) {
      mappedSocialLinks = data.social_media_links.map((link: StoredHeroSocialLink, index: number) => {
        console.log(`[HomePage] Mapping social link ${index} from DB:`, JSON.stringify(link));
        if (!link || typeof link.label !== 'string' || typeof link.url !== 'string') {
          console.warn('[HomePage] Malformed social link object in DB:', link);
          return { 
            label: 'Error',
            url: '#',
            icon_image_url: null, 
            id: crypto.randomUUID(),
          };
        }
        return {
          ...link,
          // Ensure icon_image_url is what we expect; 'icon_name' might still be in old DB data for the JSONB
          icon_image_url: link.icon_image_url || (link as any).icon_name || null, 
          id: crypto.randomUUID(),
        };
      });
      console.log('[HomePage] Mapped social_media_links for HeroSection:', JSON.stringify(mappedSocialLinks));
    } else if (data.social_media_links) {
      console.warn('[HomePage] hero_content.social_media_links is not an array or is null:', data.social_media_links);
    }
    
    return {
        id: data.id,
        main_name: data.main_name || null,
        subtitles: data.subtitles || null,
        social_media_links: mappedSocialLinks,
        updated_at: data.updated_at,
    };

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
  // The `use` hook is for client components or specific server-side promise unwrapping.
  // For page props like params/searchParams in Server Components, they are typically already resolved.
  // If direct enumeration caused issues, it was likely Next.js internals or a misinterpretation.
  // We'll access them directly if needed, or not at all if this page doesn't use them.
  // console.log('[HomePage] Resolved params:', props.params);
  // console.log('[HomePage] Resolved searchParams:', props.searchParams);

  console.log('[HomePage] Starting to render HomePage component...');
  const heroContent = await getHeroContentData();
  console.log('[HomePage] Rendering HomePage. Hero content fetched (main_name):', heroContent?.main_name || "Not fetched/available");
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
