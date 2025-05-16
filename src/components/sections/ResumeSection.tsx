
"use server";

import SectionWrapper from '@/components/ui/SectionWrapper';
import SectionTitle from '@/components/ui/SectionTitle';
import ResumeSectionClientView from './ResumeSectionClientView';
import { supabase } from '@/lib/supabaseClient';
import type { 
  ResumeExperience, 
  ResumeEducation, 
  ResumeKeySkillCategory, 
  ResumeKeySkill,
  ResumeLanguage 
} from '@/types/supabase';

async function getResumeExperience(): Promise<ResumeExperience[]> {
  const { data, error } = await supabase
    .from('resume_experience')
    .select('id, job_title, company_name, date_range, description_points, icon_image_url, sort_order, created_at') // Ensure icon_image_url is selected
    .order('sort_order', { ascending: true });
  if (error) {
    console.error("Error fetching resume experience:", error);
    return [];
  }
  return (data || []).map(item => ({ ...item, icon_image_url: item.icon_image_url || null }));
}

async function getResumeEducation(): Promise<ResumeEducation[]> {
  const { data, error } = await supabase
    .from('resume_education')
    .select('id, degree_or_certification, institution_name, date_range, description, icon_image_url, sort_order, created_at') // Ensure icon_image_url is selected
    .order('sort_order', { ascending: true });
  if (error) {
    console.error("Error fetching resume education:", error);
    return [];
  }
  return (data || []).map(item => ({ ...item, icon_image_url: item.icon_image_url || null }));
}

async function getResumeKeySkills(): Promise<ResumeKeySkillCategory[]> {
  const { data, error } = await supabase
    .from('resume_key_skill_categories')
    .select(`
      id,
      category_name,
      icon_image_url, 
      sort_order,
      created_at,
      resume_key_skills (id, skill_name, category_id, created_at)
    `) // Ensure icon_image_url is selected
    .order('sort_order', { ascending: true });

  if (error) {
    console.error("Error fetching resume key skills:", error);
    return [];
  }
  return (data || []).map(category => ({
    ...category,
    icon_image_url: category.icon_image_url || null,
    skills: (category.resume_key_skills || []).map(skill => ({...skill})) // map inner skills if needed
  }));
}

async function getResumeLanguages(): Promise<ResumeLanguage[]> {
  const { data, error } = await supabase
    .from('resume_languages')
    .select('id, language_name, proficiency, icon_image_url, sort_order, created_at') // Ensure icon_image_url is selected
    .order('sort_order', { ascending: true });
  if (error) {
    console.error("Error fetching resume languages:", error);
    return [];
  }
  return (data || []).map(item => ({ ...item, icon_image_url: item.icon_image_url || null }));
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
