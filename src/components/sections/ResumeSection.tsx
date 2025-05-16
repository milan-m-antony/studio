
"use server";

import SectionWrapper from '@/components/ui/SectionWrapper';
import SectionTitle from '@/components/ui/SectionTitle';
import ResumeSectionClientView from './ResumeSectionClientView';
import { supabase } from '@/lib/supabaseClient';
import type { 
  ResumeExperience, 
  ResumeEducation, 
  ResumeKeySkillCategory, 
  ResumeLanguage 
} from '@/types/supabase';

async function getResumeExperience(): Promise<ResumeExperience[]> {
  const { data, error } = await supabase
    .from('resume_experience')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) {
    console.error("Error fetching resume experience:", error);
    return [];
  }
  return data || [];
}

async function getResumeEducation(): Promise<ResumeEducation[]> {
  const { data, error } = await supabase
    .from('resume_education')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) {
    console.error("Error fetching resume education:", error);
    return [];
  }
  return data || [];
}

async function getResumeKeySkills(): Promise<ResumeKeySkillCategory[]> {
  const { data, error } = await supabase
    .from('resume_key_skill_categories')
    .select(`
      id,
      category_name,
      icon_name,
      sort_order,
      resume_key_skills (id, skill_name)
    `)
    .order('sort_order', { ascending: true });
    // Note: Ordering for nested resume_key_skills would need to be handled client-side or with a more complex query/RPC.

  if (error) {
    console.error("Error fetching resume key skills:", error);
    return [];
  }
  return (data || []).map(category => ({
    ...category,
    skills: category.resume_key_skills || [] // Ensure skills array is present
  }));
}

async function getResumeLanguages(): Promise<ResumeLanguage[]> {
  const { data, error } = await supabase
    .from('resume_languages')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) {
    console.error("Error fetching resume languages:", error);
    return [];
  }
  return data || [];
}


export default async function ResumeSection() {
  const [
    experienceData, 
    educationData, 
    keySkillsData, 
    languagesData
  ] = await Promise.all([
    getResumeExperience(),
    getResumeEducation(),
    getResumeKeySkills(),
    getResumeLanguages()
  ]);

  return (
    <SectionWrapper id="resume" className="section-fade-in" style={{ animationDelay: '1.2s' }}>
      <SectionTitle subtitle="Access my comprehensive resume for a detailed overview of my qualifications and experience.">
        My Resume / CV
      </SectionTitle>
      <ResumeSectionClientView
        experienceData={experienceData}
        educationData={educationData}
        keySkillsData={keySkillsData}
        languagesData={languagesData}
      />
    </SectionWrapper>
  );
}
