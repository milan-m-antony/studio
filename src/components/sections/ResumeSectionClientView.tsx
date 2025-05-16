
"use client";

import { Button } from '@/components/ui/button';
import { Download, Printer, Briefcase, GraduationCap, ListChecks, Languages as LanguagesIcon, Building, Cloud, Laptop, ServerIcon, Shield, Globe, type LucideIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import React from 'react';
import * as LucideIcons from 'lucide-react';

import type { 
  ResumeExperience, 
  ResumeEducation, 
  ResumeKeySkillCategory, 
  ResumeLanguage 
} from '@/types/supabase';

// Helper to get Lucide icon component by name
const getLucideIcon = (iconName: string | null | undefined, DefaultIcon: LucideIcon): LucideIcon => {
  if (iconName && LucideIcons[iconName as keyof typeof LucideIcons]) {
    const IconComponent = LucideIcons[iconName as keyof typeof LucideIcons] as LucideIcon;
    if (typeof IconComponent === 'function' || (typeof IconComponent === 'object' && IconComponent !== null && 'render' in IconComponent)) {
      return IconComponent;
    }
  }
  return DefaultIcon;
};


interface ResumeDetailItemProps {
  title: string;
  subtitle?: string;
  date?: string;
  description?: string | string[];
  iconName?: string | null; // Changed from icon to iconName string
  defaultIcon: LucideIcon; // Provide a default Lucide icon component
}

const ResumeDetailItem: React.FC<ResumeDetailItemProps> = ({ title, subtitle, date, description, iconName, defaultIcon }) => {
  const Icon = getLucideIcon(iconName, defaultIcon);
  return (
    <div className="mb-6">
      <div className="flex items-center mb-2">
        {Icon && <Icon className="h-6 w-6 mr-3 text-primary" />}
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
  keySkillsData: ResumeKeySkillCategory[]; // This will include nested skills
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
          (Note: PDF download link is static. Print functionality uses browser print.)
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
                    iconName={exp.icon_name}
                    defaultIcon={Building}
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
                    iconName={edu.icon_name}
                    defaultIcon={GraduationCap}
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
                keySkillsData.map((skillCategory) => {
                  const CategoryIcon = getLucideIcon(skillCategory.icon_name, ListChecks);
                  return (
                    <div key={skillCategory.id} className="mb-8">
                      <div className="flex items-center mb-3">
                        <CategoryIcon className="h-5 w-5 mr-2 text-primary" />
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
                  );
                })
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
                    iconName={lang.icon_name}
                    defaultIcon={Globe}
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
