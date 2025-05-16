
"use client";

import { Button } from '@/components/ui/button';
import { Download, Printer, Briefcase, GraduationCap, ListChecks, Languages as LanguagesIcon, Building, HelpCircle, ExternalLink, Type } from 'lucide-react'; // Added Type for generic skill category
import NextImage from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import React from 'react';

import type { 
  ResumeExperience, 
  ResumeEducation, 
  ResumeKeySkillCategory, 
  ResumeLanguage 
} from '@/types/supabase';

interface ResumeDetailItemProps {
  title: string;
  subtitle?: string;
  date?: string;
  description?: string | string[];
  iconImageUrl?: string | null; // Changed from iconName
  DefaultIconComponent?: React.ElementType; // For fallback if URL is missing
}

const ResumeDetailItem: React.FC<ResumeDetailItemProps> = ({ title, subtitle, date, description, iconImageUrl, DefaultIconComponent = Building }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center mb-2">
        {iconImageUrl ? (
          <NextImage src={iconImageUrl} alt={title} width={24} height={24} className="h-6 w-6 mr-3 rounded-sm object-contain border" />
        ) : (
          <DefaultIconComponent className="h-6 w-6 mr-3 text-primary" />
        )}
        <div>
          <h4 className="text-xl font-semibold text-foreground">{title}</h4>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {date && <p className="text-xs text-muted-foreground mb-2 ml-9">{date}</p>}
      {description && (
        <div className="ml-9 text-sm text-foreground/80">
          {Array.isArray(description) ? (
            <ul className="list-disc list-inside space-y-1">
              {description.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          ) : (
            <p>{description}</p>
          )}
        </div>
      )}
    </div>
  );
};

interface ResumeSectionClientViewProps {
  experienceData: ResumeExperience[];
  educationData: ResumeEducation[];
  keySkillsData: ResumeKeySkillCategory[];
  languagesData: ResumeLanguage[];
}

export default function ResumeSectionClientView({
  experienceData,
  educationData,
  keySkillsData,
  languagesData
}: ResumeSectionClientViewProps) {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <>
      <div className="text-center space-y-6 max-w-md mx-auto mb-12">
        <p className="text-muted-foreground">
          Download the latest version of my resume to learn more about my skills, experience, and accomplishments.
          You can also print a copy directly.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <a href="/resume-milan.pdf" download="Milan_Resume.pdf">
              <Download className="mr-2 h-5 w-5" /> Download PDF
            </a>
          </Button>
          <Button variant="outline" size="lg" onClick={handlePrint} className="w-full sm:w-auto">
            <Printer className="mr-2 h-5 w-5" /> Print Resume
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          (Note: PDF download is static. Print uses browser functionality.)
        </p>
      </div>

      <Tabs defaultValue="experience" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
          <TabsTrigger value="experience"><Briefcase className="mr-2 h-4 w-4 inline-block" />Experience</TabsTrigger>
          <TabsTrigger value="education"><GraduationCap className="mr-2 h-4 w-4 inline-block" />Education</TabsTrigger>
          <TabsTrigger value="skills"><ListChecks className="mr-2 h-4 w-4 inline-block" />Key Skills</TabsTrigger>
          <TabsTrigger value="languages"><LanguagesIcon className="mr-2 h-4 w-4 inline-block" />Languages</TabsTrigger>
        </TabsList>

        <TabsContent value="experience">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center"><Briefcase className="mr-3 h-6 w-6 text-primary" /> Professional Experience</CardTitle>
            </CardHeader>
            <CardContent>
              {experienceData && experienceData.length > 0 ? (
                experienceData.map((exp) => (
                  <ResumeDetailItem
                    key={exp.id}
                    title={exp.job_title}
                    subtitle={exp.company_name}
                    date={exp.date_range}
                    description={exp.description_points || []}
                    iconImageUrl={exp.icon_image_url}
                    DefaultIconComponent={Building}
                  />
                ))
              ) : (
                <p className="text-muted-foreground text-center">No experience entries yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="education">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center"><GraduationCap className="mr-3 h-6 w-6 text-primary" /> Education</CardTitle>
            </CardHeader>
            <CardContent>
              {educationData && educationData.length > 0 ? (
                educationData.map((edu) => (
                  <ResumeDetailItem
                    key={edu.id}
                    title={edu.degree_or_certification}
                    subtitle={edu.institution_name}
                    date={edu.date_range}
                    description={edu.description || undefined}
                    iconImageUrl={edu.icon_image_url}
                    DefaultIconComponent={GraduationCap}
                  />
                ))
              ) : (
                <p className="text-muted-foreground text-center">No education entries yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center"><ListChecks className="mr-3 h-6 w-6 text-primary" /> Key Skills</CardTitle>
            </CardHeader>
            <CardContent>
              {keySkillsData && keySkillsData.length > 0 ? (
                keySkillsData.map((skillCategory) => (
                    <div key={skillCategory.id} className="mb-8">
                      <div className="flex items-center mb-3">
                        {skillCategory.icon_image_url ? (
                            <NextImage src={skillCategory.icon_image_url} alt={skillCategory.category_name} width={20} height={20} className="h-5 w-5 mr-2 rounded-sm object-contain border" />
                        ) : (
                            <Type className="h-5 w-5 mr-2 text-primary" /> // Generic icon for category
                        )}
                        <h4 className="text-lg font-semibold text-foreground">{skillCategory.category_name}</h4>
                      </div>
                      <div className="pl-7 flex flex-wrap gap-3">
                        {skillCategory.skills && skillCategory.skills.length > 0 ? (
                          skillCategory.skills.map((skill) => (
                            <Badge key={skill.id} variant="secondary">{skill.skill_name}</Badge>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground">No skills in this category.</p>
                        )}
                      </div>
                    </div>
                  )
                )
              ) : (
                <p className="text-muted-foreground text-center">No key skill categories yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="languages">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center"><LanguagesIcon className="mr-3 h-6 w-6 text-primary" /> Languages</CardTitle>
            </CardHeader>
            <CardContent>
              {languagesData && languagesData.length > 0 ? (
                languagesData.map((lang) => (
                  <ResumeDetailItem
                    key={lang.id}
                    title={lang.language_name}
                    description={lang.proficiency || undefined}
                    iconImageUrl={lang.icon_image_url}
                    DefaultIconComponent={ExternalLink} // Using ExternalLink as a generic fallback, can be changed
                  />
                ))
              ) : (
                <p className="text-muted-foreground text-center">No language entries yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
