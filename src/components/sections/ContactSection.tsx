
"use server";

import SectionWrapper from '@/components/ui/SectionWrapper';
import SectionTitle from '@/components/ui/SectionTitle';
import ContactSectionClientView from './ContactSectionClientView';
import { supabase } from '@/lib/supabaseClient';
import type { ContactPageDetail, SocialLink } from '@/types/supabase';

const PRIMARY_CONTACT_DETAILS_ID = '00000000-0000-0000-0000-000000000005';

async function getContactPageDetails(): Promise<ContactPageDetail | null> {
  const { data, error } = await supabase
    .from('contact_page_details')
    .select('*')
    .eq('id', PRIMARY_CONTACT_DETAILS_ID)
    .maybeSingle();

  if (error) {
    console.error('Error fetching contact page details:', JSON.stringify(error, null, 2));
    return null;
  }
  return data;
}

async function getSocialLinks(): Promise<SocialLink[]> {
  const { data, error } = await supabase
    .from('social_links')
    .select('id, label, icon_image_url, url, display_text, sort_order, created_at') // Ensure icon_image_url is selected
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching social links:', JSON.stringify(error, null, 2));
    return [];
  }
  // Map icon_image_url from the database to the camelCase prop if needed,
  // but our type already uses icon_image_url, so direct mapping is fine.
  return (data || []).map(link => ({ ...link, icon_image_url: link.icon_image_url || null }));
}

export default async function ContactSection() {
  const [contactDetails, socialLinks] = await Promise.all([
    getContactPageDetails(),
    getSocialLinks()
  ]);

  // The page.tsx has force-dynamic, so this section will re-fetch on each page load.
  // router.refresh() in the admin panel also helps trigger re-fetches for server components.
  console.log('[ContactSection] Fetched social links count:', socialLinks.length);
  console.log('[ContactSection] Fetched contact details address:', contactDetails?.address);


  return (
    <SectionWrapper id="contact" className="bg-background section-fade-in" style={{ animationDelay: '1.4s' }}>
      <SectionTitle subtitle="Have a project in mind, a question, or just want to say hi? Feel free to reach out. I'm always open to discussing new opportunities.">
        Get In Touch
      </SectionTitle>
      <ContactSectionClientView contactDetails={contactDetails} socialLinks={socialLinks} />
    </SectionWrapper>
  );
}

    