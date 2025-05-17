
"use server";

import SectionWrapper from '@/components/ui/SectionWrapper';
import SectionTitle from '@/components/ui/SectionTitle';
import ContactSectionClientView from './ContactSectionClientView'; // New Client Component
import { supabase } from '@/lib/supabaseClient';
import type { ContactPageDetail, SocialLink } from '@/types/supabase';

// Fixed ID for the single contact_page_details entry
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
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching social links:', JSON.stringify(error, null, 2));
    return [];
  }
  return data || [];
}

export default async function ContactSection() {
  const [contactDetails, socialLinks] = await Promise.all([
    getContactPageDetails(),
    getSocialLinks()
  ]);

  return (
    <SectionWrapper id="contact" className="bg-background section-fade-in" style={{ animationDelay: '1.4s' }}>
      <SectionTitle subtitle="Have a project in mind, a question, or just want to say hi? Feel free to reach out. I'm always open to discussing new opportunities.">
        Get In Touch
      </SectionTitle>
      <ContactSectionClientView contactDetails={contactDetails} socialLinks={socialLinks} />
    </SectionWrapper>
  );
}

