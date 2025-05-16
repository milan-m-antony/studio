
"use client";

import { Button } from '@/components/ui/button';
import { Download, Eye } from 'lucide-react';
import NextImage from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

import type { 
  ResumeExperience, 
  ResumeEducation, 
  ResumeKeySkillCategory, 
  ResumeKeySkill,
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

const ResumeDetailItem: React.FC<ResumeDetailItemProps> = ({ title, subtitle, date, description, iconImageUrl, DefaultIconComponent }) => {
  let ActualIconComponent: React.ElementType | null = DefaultIconComponent || null;
  
  // Prioritize image URL if available
  const iconContent = iconImageUrl ? (
    <div className="relative h-6 w-6 rounded-sm overflow-hidden border bg-muted flex-shrink-0">
      <NextImage src={iconImageUrl} alt={`${title} icon`} fill className="object-contain" sizes="24px" />
    </div>
  ) : ActualIconComponent ? (
    <ActualIconComponent className="h-6 w-6 text-primary flex-shrink-0" />
  ) : (
    <div className="h-6 w-6 text-primary flex-shrink-0"> {/* Fallback empty div or simple shape */}
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>
    </div>
  );

  return (
    <div className="mb-6 last:mb-0">
      <div className="flex items-start mb-1">
        <div className="mr-3 mt-1">
          {iconContent}
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
  const [formattedLastUpdated, setFormattedLastUpdated] = useState<string | null>(null);
  const { toast } = useToast();

  const resumePdfUrl = resumeMetaData?.resume_pdf_url;
  const resumeDescription = resumeMetaData?.description;

  useEffect(() => {
    if (resumeMetaData?.updated_at) {
      try {
        const date = parseISO(resumeMetaData.updated_at);
        if (isValid(date)) {
          setFormattedLastUpdated(format(date, "MMMM d, yyyy 'at' h:mm a"));
        } else {
          console.warn("ResumeSectionClientView: Received invalid date for updated_at:", resumeMetaData.updated_at);
          setFormattedLastUpdated("Date unavailable");
        }
      } catch (error) {
        console.error("Error formatting resume updated_at date:", error);
        setFormattedLastUpdated("Date unavailable");
      }
    } else {
      setFormattedLastUpdated(null);
    }
  }, [resumeMetaData?.updated_at]);

  const handleDownloadClick = async () => {
    if (!resumePdfUrl) {
      toast({
        title: "Download Unavailable",
        description: "No resume PDF is currently available for download.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Resume Download",
      description: "Your resume PDF is being prepared for download.",
      variant: "default",
    });

    try {
      const response = await fetch(resumePdfUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = "Milan_Resume.pdf"; 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href); 
    } catch (error) {
      console.error("Error during PDF download:", error);
      toast({
        title: "Download Failed",
        description: "Could not download the PDF. Please try again later or check the URL.",
        variant: "destructive",
      });
    }
  };


  return (
    <>
      <div className="text-center space-y-6 max-w-3xl mx-auto mb-12">
        {resumeDescription && (
          <p className="text-muted-foreground text-lg leading-relaxed max-w-3xl mx-auto">
            {resumeDescription}
          </p>
        )}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          {resumePdfUrl && (
            <Button onClick={() => setIsPdfPreviewOpen(true)} size="lg" className="w-full sm:w-auto">
              <Eye className="mr-2 h-5 w-5" /> Preview PDF
            </Button>
          )}
          <Button 
            size="lg" 
            className="w-full sm:w-auto" 
            onClick={handleDownloadClick} 
            disabled={!resumePdfUrl}
            aria-disabled={!resumePdfUrl}
          >
            <Download className="mr-2 h-5 w-5" /> Download PDF
          </Button>
        </div>
        {!resumePdfUrl && (
           <p className="text-xs text-muted-foreground mt-2">
            (Resume PDF not available. Please upload one via the admin panel.)
          </p>
        )}
         {formattedLastUpdated && (
          <p className="text-xs text-muted-foreground mt-4">
            Last Updated: {formattedLastUpdated}
          </p>
        )}
      </div>

      {resumePdfUrl && (
        <Dialog open={isPdfPreviewOpen} onOpenChange={setIsPdfPreviewOpen}>
          <DialogContent className="max-w-4xl w-[95vw] md:w-[90vw] h-[90vh] p-0 flex flex-col overflow-hidden">
            <DialogHeader className="p-4 border-b shrink-0">
              <DialogTitle>Resume Preview</DialogTitle>
              <DialogDescription>
                Viewing PDF. You can also download it using the "Download PDF" button.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-grow p-0 m-0 overflow-hidden">
              <iframe
                src={resumePdfUrl}
                title="Resume PDF Preview"
                className="w-full h-full border-0"
              />
            </div>
            <DialogClose asChild>
                <Button type="button" variant="outline" className="m-4 mt-0 self-end shrink-0">Close Preview</Button>
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
                    DefaultIconComponent={Briefcase}
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
                            <ListChecks className="h-5 w-5 mr-2 text-primary flex-shrink-0" /> // Default category icon
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
                    DefaultIconComponent={LanguagesIcon} 
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

