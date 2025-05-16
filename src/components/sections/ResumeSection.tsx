
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
  const { data, error, status, statusText } = await supabase
    .from('resume_experience')
    .select('id, job_title, company_name, date_range, description_points, icon_image_url, sort_order, created_at')
    .order('sort_order', { ascending: true });

  if (error) {
    let errorMessage = 'Error fetching resume experience. ';
    if (typeof error === 'object' && error !== null) {
      const supabaseError = error as { message?: string; details?: string; hint?: string; code?: string };
      errorMessage += `Message: ${supabaseError.message || 'N/A'}, Details: ${supabaseError.details || 'N/A'}, Hint: ${supabaseError.hint || 'N/A'}, Code: ${supabaseError.code || 'N/A'}. `;
    }
    errorMessage += `Status: ${status || 'N/A'} ${statusText || 'N/A'}.`;
    console.error(errorMessage);
    return [];
  }
  return (data || []).map(item => ({ ...item, icon_image_url: item.icon_image_url || null }));
}

async function getResumeEducation(): Promise<ResumeEducation[]> {
  const { data, error, status, statusText } = await supabase
    .from('resume_education')
    .select('id, degree_or_certification, institution_name, date_range, description, icon_image_url, sort_order, created_at')
    .order('sort_order', { ascending: true });

  if (error) {
    let errorMessage = 'Error fetching resume education. ';
    if (typeof error === 'object' && error !== null) {
      const supabaseError = error as { message?: string; details?: string; hint?: string; code?: string };
      errorMessage += `Message: ${supabaseError.message || 'N/A'}, Details: ${supabaseError.details || 'N/A'}, Hint: ${supabaseError.hint || 'N/A'}, Code: ${supabaseError.code || 'N/A'}. `;
    }
    errorMessage += `Status: ${status || 'N/A'} ${statusText || 'N/A'}.`;
    console.error(errorMessage); // Enhanced logging
    return [];
  }
  return (data || []).map(item => ({ ...item, icon_image_url: item.icon_image_url || null }));
}

async function getResumeKeySkills(): Promise<ResumeKeySkillCategory[]> {
  const { data, error, status, statusText } = await supabase
    .from('resume_key_skill_categories')
    .select(`
      id,
      category_name,
      icon_image_url,
      sort_order,
      created_at,
      resume_key_skills (id, skill_name, category_id, created_at)
    `)
    .order('sort_order', { ascending: true })
    .order('created_at', { foreignTable: 'resume_key_skills', ascending: true });

  if (error) {
    let errorMessage = 'Error fetching resume key skills. ';
    if (typeof error === 'object' && error !== null) {
      const supabaseError = error as { message?: string; details?: string; hint?: string; code?: string };
      errorMessage += `Message: ${supabaseError.message || 'N/A'}, Details: ${supabaseError.details || 'N/A'}, Hint: ${supabaseError.hint || 'N/A'}, Code: ${supabaseError.code || 'N/A'}. `;
    }
    errorMessage += `Status: ${status || 'N/A'} ${statusText || 'N/A'}.`;
    console.error(errorMessage);
    return [];
  }
  return (data || []).map(category => ({
    ...category,
    icon_image_url: category.icon_image_url || null,
    skills: (category.resume_key_skills || []).map(skill => ({ ...skill }))
  }));
}

async function getResumeLanguages(): Promise<ResumeLanguage[]> {
  const { data, error, status, statusText } = await supabase
    .from('resume_languages')
    .select('id, language_name, proficiency, icon_image_url, sort_order, created_at')
    .order('sort_order', { ascending: true });

  if (error) {
    let errorMessage = 'Error fetching resume languages. ';
    if (typeof error === 'object' && error !== null) {
      const supabaseError = error as { message?: string; details?: string; hint?: string; code?: string };
      errorMessage += `Message: ${supabaseError.message || 'N/A'}, Details: ${supabaseError.details || 'N/A'}, Hint: ${supabaseError.hint || 'N/A'}, Code: ${supabaseError.code || 'N/A'}. `;
    }
    errorMessage += `Status: ${status || 'N/A'} ${statusText || 'N/A'}.`;
    console.error(errorMessage);
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
