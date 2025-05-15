
"use server"; // This component will now fetch data on the server.

import SectionWrapper from '@/components/ui/SectionWrapper';
import SectionTitle from '@/components/ui/SectionTitle';
import AboutSectionClientView from './AboutSectionClientView'; // New client component
import { supabase } from '@/lib/supabaseClient';
import type { AboutContent } from '@/types/supabase';

// This ID must match the one used in AdminDashboardPage.tsx and your database
const PRIMARY_ABOUT_CONTENT_ID = '00000000-0000-0000-0000-000000000001';

async function getAboutContent(): Promise<AboutContent | null> {
  const { data, error } = await supabase
    .from('about_content')
    .select('*')
    .eq('id', PRIMARY_ABOUT_CONTENT_ID)
    .single(); // Use single() as we expect only one row for this ID

  if (error) {
    console.error('Error fetching About Me content:', error);
    return null;
  }
  if (!data) {
    console.warn('No About Me content found for ID:', PRIMARY_ABOUT_CONTENT_ID);
    return null;
  }
  // Map Supabase row (snake_case) to AboutContent type (camelCase for imageUrl)
  return {
    id: data.id,
    headline_main: data.headline_main,
    headline_code_keyword: data.headline_code_keyword,
    headline_connector: data.headline_connector,
    headline_creativity_keyword: data.headline_creativity_keyword,
    paragraph1: data.paragraph1,
    paragraph2: data.paragraph2,
    paragraph3: data.paragraph3,
    imageUrl: data.image_url, // mapping
    image_tagline: data.image_tagline,
    updated_at: data.updated_at,
  };
}

export default async function AboutSection() {
  const aboutContent = await getAboutContent();

  // Provide default/fallback content if nothing is fetched
  const defaults: AboutContent = {
    id: PRIMARY_ABOUT_CONTENT_ID,
    headline_main: "Milan: Weaving ",
    headline_code_keyword: "Code",
    headline_connector: " with ",
    headline_creativity_keyword: "Creativity",
    paragraph1: "Hello! I'm Milan, a passionate Creative Developer...",
    paragraph2: "With a foundation in Computer Science...",
    paragraph3: "Beyond the screen, I enjoy exploring...",
    imageUrl: "https://picsum.photos/seed/aboutmilan/600/800",
    image_tagline: "Fuelled by coffee & code.",
  };

  const contentToDisplay = aboutContent ? {
    headline_main: aboutContent.headline_main || defaults.headline_main,
    headline_code_keyword: aboutContent.headline_code_keyword || defaults.headline_code_keyword,
    headline_connector: aboutContent.headline_connector || defaults.headline_connector,
    headline_creativity_keyword: aboutContent.headline_creativity_keyword || defaults.headline_creativity_keyword,
    paragraph1: aboutContent.paragraph1 || defaults.paragraph1,
    paragraph2: aboutContent.paragraph2 || defaults.paragraph2,
    paragraph3: aboutContent.paragraph3 || defaults.paragraph3,
    imageUrl: aboutContent.imageUrl || defaults.imageUrl,
    image_tagline: aboutContent.image_tagline || defaults.image_tagline,
  } : { // Spread defaults if aboutContent is entirely null
    ...defaults
  };


  return (
    <SectionWrapper id="about" className="section-fade-in bg-background overflow-hidden" style={{ animationDelay: '0.2s' }}>
      <SectionTitle subtitle="A little more about who I am and what I do.">
        About Me
      </SectionTitle>
      <AboutSectionClientView content={contentToDisplay} />
    </SectionWrapper>
  );
}
