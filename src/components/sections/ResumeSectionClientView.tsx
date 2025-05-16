
"use client";

import { Button } from '@/components/ui/button';
import { Download, Printer, Briefcase, GraduationCap, ListChecks, Languages as LanguagesIcon, Building, HelpCircle, ExternalLink, Type as DefaultCategoryIcon, Eye } from 'lucide-react';
import NextImage from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

import type { 
  ResumeExperience, 
  ResumeEducation, 
  ResumeKeySkillCategory, 
  ResumeLanguage,
  ResumeMeta
} from '@/types/supabase';

interface ResumeDetailItemProps {
  title: string;
  subtitle?: string;
  date?: string;
  description?: string | string[];
  iconImageUrl?: string | null;
  DefaultIconComponent?: React.ElementType;
}

const ResumeDetailItem: React.FC<ResumeDetailItemProps> = ({ title, subtitle, date, description, iconImageUrl, DefaultIconComponent = Building }) => {
  return (
    <div className="mb-6 last:mb-0">
      <div className="flex items-start mb-1">
        <div className="flex-shrink-0 mr-3 mt-1">
          {iconImageUrl ? (
            <div className="relative h-6 w-6 rounded-sm overflow-hidden border bg-muted">
              <NextImage src={iconImageUrl} alt={`${title} icon`} fill className="object-contain" sizes="24px" />
            </div>
          ) : (
            <DefaultIconComponent className="h-6 w-6 text-primary" />
          )}
        </div>
        <div className="flex-grow">
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
  resumeMetaData: ResumeMeta | null;
  experienceData: ResumeExperience[];
  educationData: ResumeEducation[];
  keySkillsData: ResumeKeySkillCategory[];
  languagesData: ResumeLanguage[];
}

export default function ResumeSectionClientView({
  resumeMetaData,
  experienceData,
  educationData,
  keySkillsData,
  languagesData
}: ResumeSectionClientViewProps) {
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const resumePdfUrl = resumeMetaData?.resume_pdf_url;
  const resumeDescription = resumeMetaData?.description;

  return (
    <>
      <div className="text-center space-y-6 max-w-3xl mx-auto mb-12">
        {resumeDescription && (
          <p className="text-muted-foreground text-lg leading-relaxed">
            {resumeDescription}
          </p>
        )}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          {resumePdfUrl && (
            <Button onClick={() => setIsPdfPreviewOpen(true)} size="lg" className="w-full sm:w-auto">
              <Eye className="mr-2 h-5 w-5" /> Preview PDF
            </Button>
          )}
          <Button asChild size="lg" className="w-full sm:w-auto" disabled={!resumePdfUrl}>
            <a href={resumePdfUrl || "#"} download="Milan_Resume.pdf" target="_blank" rel="noopener noreferrer" aria-disabled={!resumePdfUrl}>
              <Download className="mr-2 h-5 w-5" /> Download PDF
            </a>
          </Button>
          <Button variant="outline" size="lg" onClick={handlePrint} className="w-full sm:w-auto">
            <Printer className="mr-2 h-5 w-5" /> Print Page
          </Button>
        </div>
        {!resumePdfUrl && (
           <p className="text-xs text-muted-foreground">
            (Resume PDF not available for download or preview currently. Print functionality prints the current web page view.)
          </p>
        )}
      </div>

      {resumePdfUrl && (
        <Dialog open={isPdfPreviewOpen} onOpenChange={setIsPdfPreviewOpen}>
          <DialogContent className="max-w-4xl w-[90vw] h-[90vh] p-0 flex flex-col">
            <DialogHeader className="p-4 border-b">
              <DialogTitle>Resume Preview</DialogTitle>
              <DialogDescription>
                Viewing PDF. You can also download it or print from your browser's PDF viewer.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-grow p-0 m-0">
              <iframe
                src={resumePdfUrl}
                title="Resume PDF Preview"
                className="w-full h-full border-0"
              />
            </div>
            <DialogClose asChild>
                <Button type="button" variant="outline" className="m-4 mt-0 self-end">Close</Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      )}

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
                <p className="text-muted-foreground text-center py-4">No professional experience entries yet.</p>
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
                <p className="text-muted-foreground text-center py-4">No education entries yet.</p>
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
                    <div key={skillCategory.id} className="mb-6 last:mb-0">
                      <div className="flex items-center mb-3">
                        {skillCategory.icon_image_url ? (
                            <div className="relative h-5 w-5 mr-2 rounded-sm overflow-hidden border bg-muted flex-shrink-0">
                                <NextImage src={skillCategory.icon_image_url} alt={skillCategory.category_name} fill className="object-contain" sizes="20px" />
                            </div>
                        ) : (
                            <DefaultCategoryIcon className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
                        )}
                        <h4 className="text-lg font-semibold text-foreground">{skillCategory.category_name}</h4>
                      </div>
                      <div className="pl-7 flex flex-wrap gap-2">
                        {skillCategory.skills && skillCategory.skills.length > 0 ? (
                          skillCategory.skills.map((skill) => (
                            <Badge key={skill.id} variant="secondary">{skill.skill_name}</Badge>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground">No skills listed in this category.</p>
                        )}
                      </div>
                    </div>
                  )
                )
              ) : (
                <p className="text-muted-foreground text-center py-4">No key skill categories yet.</p>
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
                    DefaultIconComponent={ExternalLink} 
                  />
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No language entries yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
