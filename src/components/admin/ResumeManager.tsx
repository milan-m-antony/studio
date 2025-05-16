
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Briefcase, GraduationCap, ListChecks, Languages as LanguagesIcon, Image as ImageIcon, Building } from 'lucide-react';
import NextImage from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import type { ResumeExperience, ResumeEducation, ResumeKeySkillCategory, ResumeKeySkill, ResumeLanguage } from '@/types/supabase';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

// Zod Schemas
const resumeExperienceSchema = z.object({
  id: z.string().uuid().optional(),
  job_title: z.string().min(2, "Job title is required"),
  company_name: z.string().min(2, "Company name is required"),
  date_range: z.string().optional(),
  description_points: z.string().transform(val => val.split('\n').map(p => p.trim()).filter(Boolean)).optional(),
  icon_image_url: z.string().url("Must be a valid URL if provided.").optional().or(z.literal("")).nullable(),
  sort_order: z.coerce.number().optional().default(0),
});
type ResumeExperienceFormData = z.infer<typeof resumeExperienceSchema>;

// Placeholder: Zod schemas for other sections would be similar
const resumeEducationSchema = z.object({
  id: z.string().uuid().optional(),
  degree_or_certification: z.string().min(2, "Degree/Certification is required"),
  institution_name: z.string().min(2, "Institution name is required"),
  date_range: z.string().optional(),
  description: z.string().optional().nullable(),
  icon_image_url: z.string().url("Must be a valid URL if provided.").optional().or(z.literal("")).nullable(),
  sort_order: z.coerce.number().optional().default(0),
});
type ResumeEducationFormData = z.infer<typeof resumeEducationSchema>;

const resumeKeySkillCategorySchema = z.object({
  id: z.string().uuid().optional(),
  category_name: z.string().min(2, "Category name is required"),
  icon_image_url: z.string().url("Must be a valid URL if provided.").optional().or(z.literal("")).nullable(),
  sort_order: z.coerce.number().optional().default(0),
});
type ResumeKeySkillCategoryFormData = z.infer<typeof resumeKeySkillCategorySchema>;

const resumeKeySkillSchema = z.object({
  id: z.string().uuid().optional(),
  skill_name: z.string().min(1, "Skill name is required"),
  category_id: z.string().uuid("Category ID is required"),
});
type ResumeKeySkillFormData = z.infer<typeof resumeKeySkillSchema>;


const resumeLanguageSchema = z.object({
  id: z.string().uuid().optional(),
  language_name: z.string().min(2, "Language name is required"),
  proficiency: z.string().optional().nullable(),
  icon_image_url: z.string().url("Must be a valid URL if provided.").optional().or(z.literal("")).nullable(),
  sort_order: z.coerce.number().optional().default(0),
});
type ResumeLanguageFormData = z.infer<typeof resumeLanguageSchema>;


export default function ResumeManager() {
  const router = useRouter();
  const { toast } = useToast();

  const [experiences, setExperiences] = useState<ResumeExperience[]>([]);
  const [isLoadingExperiences, setIsLoadingExperiences] = useState(false);
  const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);
  const [currentExperience, setCurrentExperience] = useState<ResumeExperience | null>(null);
  const [experienceToDelete, setExperienceToDelete] = useState<ResumeExperience | null>(null);

  const experienceForm = useForm<ResumeExperienceFormData>({
    resolver: zodResolver(resumeExperienceSchema),
    defaultValues: { job_title: '', company_name: '', date_range: '', description_points: [], icon_image_url: '', sort_order: 0 }
  });

  useEffect(() => {
    fetchExperiences();
    // TODO: Fetch data for other sections when implemented
  }, []);

  const fetchExperiences = async () => {
    setIsLoadingExperiences(true);
    const { data, error } = await supabase.from('resume_experience').select('*').order('sort_order', { ascending: true });
    if (error) {
      toast({ title: "Error fetching experiences", description: error.message, variant: "destructive" });
    } else {
      setExperiences(data?.map(exp => ({
        ...exp,
        icon_image_url: exp.icon_image_url || null
      })) || []);
    }
    setIsLoadingExperiences(false);
  };

  const onExperienceSubmit: SubmitHandler<ResumeExperienceFormData> = async (formData) => {
    const dataToSave = {
      ...formData,
      description_points: formData.description_points || [],
      icon_image_url: formData.icon_image_url?.trim() === '' ? null : formData.icon_image_url,
    };

    let response;
    if (formData.id) {
      response = await supabase.from('resume_experience').update(dataToSave).eq('id', formData.id).select();
    } else {
      const { id, ...insertData } = dataToSave;
      response = await supabase.from('resume_experience').insert(insertData).select();
    }
    if (response.error) {
      toast({ title: "Error saving experience", description: response.error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Experience saved." });
      fetchExperiences();
      setIsExperienceModalOpen(false);
      router.refresh();
    }
  };

  const handleDeleteExperience = async () => {
    if (!experienceToDelete) return;
    const { error } = await supabase.from('resume_experience').delete().eq('id', experienceToDelete.id);
    if (error) {
      toast({ title: "Error deleting experience", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Experience deleted." });
      fetchExperiences();
      router.refresh();
    }
    setExperienceToDelete(null);
  };

  const handleOpenExperienceModal = (experience?: ResumeExperience) => {
    setCurrentExperience(experience || null);
    experienceForm.reset(experience ? {
        ...experience,
        description_points: experience.description_points?.join('\n') || '',
        icon_image_url: experience.icon_image_url || '',
    } : { job_title: '', company_name: '', date_range: '', description_points: [], icon_image_url: '', sort_order: 0 });
    setIsExperienceModalOpen(true);
  };
  
  const IconPreview = ({ url }: { url: string | null | undefined }) => {
    if (!url) return <ImageIcon className="h-8 w-8 text-muted-foreground" />;
    return <NextImage src={url} alt="Icon Preview" width={32} height={32} className="rounded object-contain border" />;
  };


  return (
    <Card className="shadow-lg mb-8">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Manage Resume Content
          <Briefcase className="h-6 w-6 text-primary" />
        </CardTitle>
        <CardDescription>Update your professional experience, education, skills, and languages.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="experience" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
            <TabsTrigger value="experience"><Briefcase className="mr-2 h-4 w-4" />Experience</TabsTrigger>
            <TabsTrigger value="education" disabled><GraduationCap className="mr-2 h-4 w-4" />Education (Soon)</TabsTrigger>
            <TabsTrigger value="skills" disabled><ListChecks className="mr-2 h-4 w-4" />Key Skills (Soon)</TabsTrigger>
            <TabsTrigger value="languages" disabled><LanguagesIcon className="mr-2 h-4 w-4" />Languages (Soon)</TabsTrigger>
          </TabsList>

          <TabsContent value="experience">
            <div className="text-right mb-4">
              <Button onClick={() => handleOpenExperienceModal()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Experience
              </Button>
            </div>
            {isLoadingExperiences ? <p>Loading experiences...</p> : experiences.length === 0 ? <p className="text-muted-foreground text-center py-4">No experience entries yet.</p> : (
              <div className="space-y-4">
                {experiences.map((exp) => (
                  <Card key={exp.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        {exp.icon_image_url ? (
                           <NextImage src={exp.icon_image_url} alt={exp.job_title} width={40} height={40} className="rounded-md object-contain border" />
                        ) : (
                          <Building className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                        )}
                        <div>
                          <h4 className="font-semibold text-lg">{exp.job_title}</h4>
                          <p className="text-sm text-muted-foreground">{exp.company_name} ({exp.date_range})</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenExperienceModal(exp)}><Edit className="mr-1 h-3 w-3" />Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => setExperienceToDelete(exp)}><Trash2 className="mr-1 h-3 w-3" />Delete</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="education"><p className="text-center text-muted-foreground py-8">Education management coming soon.</p></TabsContent>
          <TabsContent value="skills"><p className="text-center text-muted-foreground py-8">Key Skills management coming soon.</p></TabsContent>
          <TabsContent value="languages"><p className="text-center text-muted-foreground py-8">Languages management coming soon.</p></TabsContent>
        </Tabs>

        <Dialog open={isExperienceModalOpen} onOpenChange={(isOpen) => { setIsExperienceModalOpen(isOpen); if (!isOpen) setCurrentExperience(null); }}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{currentExperience ? 'Edit Experience' : 'Add New Experience'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={experienceForm.handleSubmit(onExperienceSubmit)} className="grid gap-4 py-4">
              <ScrollArea className="max-h-[70vh] p-1">
                <div className="grid gap-4 p-3">
                    <div><Label htmlFor="job_title">Job Title</Label><Input id="job_title" {...experienceForm.register("job_title")} />{experienceForm.formState.errors.job_title && <p className="text-destructive text-sm mt-1">{experienceForm.formState.errors.job_title.message}</p>}</div>
                    <div><Label htmlFor="company_name">Company Name</Label><Input id="company_name" {...experienceForm.register("company_name")} />{experienceForm.formState.errors.company_name && <p className="text-destructive text-sm mt-1">{experienceForm.formState.errors.company_name.message}</p>}</div>
                    <div><Label htmlFor="date_range">Date Range (e.g., Jan 2023 - Present)</Label><Input id="date_range" {...experienceForm.register("date_range")} /></div>
                    <div><Label htmlFor="description_points">Description (one point per line)</Label><Textarea id="description_points" {...experienceForm.register("description_points")} rows={5} /></div>
                    <div>
                      <Label htmlFor="exp_icon_image_url">Icon Image URL (Optional)</Label>
                      <Input id="exp_icon_image_url" {...experienceForm.register("icon_image_url")} placeholder="https://example.com/icon.png" />
                      {experienceForm.formState.errors.icon_image_url && <p className="text-destructive text-sm mt-1">{experienceForm.formState.errors.icon_image_url.message}</p>}
                       {experienceForm.watch("icon_image_url") && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs">Preview:</span>
                          <IconPreview url={experienceForm.watch("icon_image_url")} />
                        </div>
                      )}
                    </div>
                    <div><Label htmlFor="exp_sort_order">Sort Order</Label><Input id="exp_sort_order" type="number" {...experienceForm.register("sort_order")} /></div>
                </div>
              </ScrollArea>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit">{currentExperience ? 'Save Changes' : 'Add Experience'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!experienceToDelete} onOpenChange={() => setExperienceToDelete(null)}>
          <AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground">
            <AlertDialogHeader><AlertDialogTitle className="text-destructive-foreground">Delete Experience: {experienceToDelete?.job_title}?</AlertDialogTitle><AlertDialogDescription className="text-destructive-foreground/90">This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground", "hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteExperience} className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive", "hover:bg-destructive-foreground/90")}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
