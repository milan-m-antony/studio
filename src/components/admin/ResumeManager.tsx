
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Briefcase, GraduationCap, ListChecks, Languages as LanguagesIcon, Building } from 'lucide-react';
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
  description_points: z.string().transform(val => val.split('\n').map(p => p.trim()).filter(Boolean)).optional(), // Textarea input, split by newline
  icon_name: z.string().optional().nullable(),
  sort_order: z.coerce.number().optional().default(0),
});
type ResumeExperienceFormData = z.infer<typeof resumeExperienceSchema>;

// Add Zod schemas for Education, KeySkillCategory, KeySkill, Language
// ... (These will be similar in structure to resumeExperienceSchema)

export default function ResumeManager() {
  const router = useRouter();
  const { toast } = useToast();

  // State for each resume section
  const [experiences, setExperiences] = useState<ResumeExperience[]>([]);
  // ... (state for education, keySkillCategories, keySkills, languages)

  const [isLoading, setIsLoading] = useState(false);
  
  // State for modals and delete confirmations
  const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);
  const [currentExperience, setCurrentExperience] = useState<ResumeExperience | null>(null);
  const [experienceToDelete, setExperienceToDelete] = useState<ResumeExperience | null>(null);
  // ... (similar modal/delete states for other sections)

  const experienceForm = useForm<ResumeExperienceFormData>({
    resolver: zodResolver(resumeExperienceSchema),
    defaultValues: { job_title: '', company_name: '', date_range: '', description_points: [], icon_name: '', sort_order: 0 }
  });
  // ... (useForm instances for other sections)

  useEffect(() => {
    fetchExperiences();
    // fetchEducation();
    // fetchKeySkillCategories();
    // fetchLanguages();
  }, []);

  // Fetch functions
  const fetchExperiences = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('resume_experience').select('*').order('sort_order', { ascending: true });
    if (error) {
      toast({ title: "Error fetching experiences", description: error.message, variant: "destructive" });
    } else {
      setExperiences(data || []);
    }
    setIsLoading(false);
  };
  // ... (fetch functions for other sections)

  // Submit handlers
  const onExperienceSubmit: SubmitHandler<ResumeExperienceFormData> = async (formData) => {
    const dataToSave = {
      ...formData,
      description_points: formData.description_points || [], // Ensure it's an array
    };

    let response;
    if (formData.id) {
      response = await supabase.from('resume_experience').update(dataToSave).eq('id', formData.id);
    } else {
      const { id, ...insertData } = dataToSave;
      response = await supabase.from('resume_experience').insert(insertData);
    }
    if (response.error) {
      toast({ title: "Error saving experience", description: response.error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Experience saved." });
      fetchExperiences();
      setIsExperienceModalOpen(false);
    }
  };
  // ... (submit handlers for other sections)

  // Delete handlers
  const handleDeleteExperience = async () => {
    if (!experienceToDelete) return;
    const { error } = await supabase.from('resume_experience').delete().eq('id', experienceToDelete.id);
    if (error) {
      toast({ title: "Error deleting experience", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Experience deleted." });
      fetchExperiences();
    }
    setExperienceToDelete(null);
  };
  // ... (delete handlers for other sections)


  // Modal open/close handlers
  const handleOpenExperienceModal = (experience?: ResumeExperience) => {
    setCurrentExperience(experience || null);
    experienceForm.reset(experience ? {
        ...experience,
        description_points: experience.description_points?.join('\n') || '', // Join for textarea
    } : { job_title: '', company_name: '', date_range: '', description_points: [], icon_name: '', sort_order: 0 });
    setIsExperienceModalOpen(true);
  };

  // For now, only Experience section is partially implemented.
  // Other sections (Education, Skills, Languages) would follow a similar pattern.

  return (
    <Card className="shadow-lg">
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
            {isLoading ? <p>Loading experiences...</p> : experiences.length === 0 ? <p className="text-muted-foreground text-center py-4">No experience entries yet.</p> : (
              <div className="space-y-4">
                {experiences.map((exp) => (
                  <Card key={exp.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-lg">{exp.job_title}</h4>
                        <p className="text-sm text-muted-foreground">{exp.company_name} ({exp.date_range})</p>
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
          {/* Placeholder TabsContent for other sections */}
          <TabsContent value="education"><p className="text-center text-muted-foreground py-8">Education management coming soon.</p></TabsContent>
          <TabsContent value="skills"><p className="text-center text-muted-foreground py-8">Key Skills management coming soon.</p></TabsContent>
          <TabsContent value="languages"><p className="text-center text-muted-foreground py-8">Languages management coming soon.</p></TabsContent>
        </Tabs>

        {/* Experience Modal */}
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
                    <div><Label htmlFor="exp_icon_name">Icon Name (Lucide, optional)</Label><Input id="exp_icon_name" {...experienceForm.register("icon_name")} placeholder="e.g., Briefcase" /></div>
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

        {/* Delete Confirmation Modals */}
        <AlertDialog open={!!experienceToDelete} onOpenChange={() => setExperienceToDelete(null)}>
          <AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground">
            <AlertDialogHeader><AlertDialogTitle className="text-destructive-foreground">Delete Experience: {experienceToDelete?.job_title}?</AlertDialogTitle><AlertDialogDescription className="text-destructive-foreground/90">This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground", "hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteExperience} className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive", "hover:bg-destructive-foreground/90")}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {/* ... (Delete modals for other sections) */}
      </CardContent>
    </Card>
  );
}

