
"use client";

import React, { useEffect, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Briefcase, GraduationCap, ListChecks, Languages as LanguagesIcon, FileText as ResumeIcon, UploadCloud, Download, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import NextImage from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import type { ResumeExperience, ResumeEducation, ResumeKeySkillCategory, ResumeKeySkill, ResumeLanguage, ResumeMeta } from '@/types/supabase';
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

const RESUME_META_ID = '00000000-0000-0000-0000-000000000003'; // Fixed ID for resume_meta

// Zod Schemas
const resumeMetaSchema = z.object({
  id: z.string().uuid().default(RESUME_META_ID),
  description: z.string().optional().nullable(),
  resume_pdf_url: z.string().url("Must be valid URL or will be set by upload").optional().or(z.literal("")).nullable(),
});
type ResumeMetaFormData = z.infer<typeof resumeMetaSchema>;

const resumeExperienceSchema = z.object({
  id: z.string().uuid().optional(),
  job_title: z.string().min(2, "Job title is required"),
  company_name: z.string().min(2, "Company name is required"),
  date_range: z.string().optional().nullable(),
  description_points: z.string().transform(val => val.split('\n').map(p => p.trim()).filter(Boolean)).optional(),
  icon_image_url: z.string().url("Must be a valid URL if provided.").optional().or(z.literal("")).nullable(),
  sort_order: z.coerce.number().optional().default(0),
});
type ResumeExperienceFormData = z.infer<typeof resumeExperienceSchema>;

const resumeEducationSchema = z.object({
  id: z.string().uuid().optional(),
  degree_or_certification: z.string().min(2, "Degree/Certification is required"),
  institution_name: z.string().min(2, "Institution name is required"),
  date_range: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  icon_image_url: z.string().url("Must be a valid URL if provided.").optional().or(z.literal("")).nullable(),
  sort_order: z.coerce.number().optional().default(0),
});
type ResumeEducationFormData = z.infer<typeof resumeEducationSchema>;

// Placeholder: Zod schemas for Key Skills and Languages will be added later

const IconPreview = ({ url, alt = "Icon Preview" }: { url?: string | null; alt?: string }) => {
  if (!url) return <ImageIcon className="h-8 w-8 text-muted-foreground border rounded p-1" />;
  return <NextImage src={url} alt={alt} width={32} height={32} className="rounded object-contain border" />;
};

export default function ResumeManager() {
  const router = useRouter();
  const { toast } = useToast();

  // Resume Meta State
  const [resumeMeta, setResumeMeta] = useState<ResumeMeta | null>(null);
  const [isLoadingResumeMeta, setIsLoadingResumeMeta] = useState(false);
  const [resumePdfFile, setResumePdfFile] = useState<File | null>(null);
  const [currentDbResumePdfUrl, setCurrentDbResumePdfUrl] = useState<string | null>(null);

  // Experience State
  const [experiences, setExperiences] = useState<ResumeExperience[]>([]);
  const [isLoadingExperiences, setIsLoadingExperiences] = useState(false);
  const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);
  const [currentExperience, setCurrentExperience] = useState<ResumeExperience | null>(null);
  const [experienceToDelete, setExperienceToDelete] = useState<ResumeExperience | null>(null);

  // Education State
  const [educationItems, setEducationItems] = useState<ResumeEducation[]>([]);
  const [isLoadingEducation, setIsLoadingEducation] = useState(false);
  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
  const [currentEducation, setCurrentEducation] = useState<ResumeEducation | null>(null);
  const [educationToDelete, setEducationToDelete] = useState<ResumeEducation | null>(null);

  // Forms
  const resumeMetaForm = useForm<ResumeMetaFormData>({
    resolver: zodResolver(resumeMetaSchema),
    defaultValues: { id: RESUME_META_ID, description: '', resume_pdf_url: '' }
  });
  const experienceForm = useForm<ResumeExperienceFormData>({
    resolver: zodResolver(resumeExperienceSchema),
    defaultValues: { job_title: '', company_name: '', date_range: '', description_points: [], icon_image_url: '', sort_order: 0 }
  });
  const educationForm = useForm<ResumeEducationFormData>({
    resolver: zodResolver(resumeEducationSchema),
    defaultValues: { degree_or_certification: '', institution_name: '', date_range: '', description: '', icon_image_url: '', sort_order: 0 }
  });


  useEffect(() => {
    fetchResumeMeta();
    fetchExperiences();
    fetchEducationItems();
    // TODO: Fetch data for Key Skills and Languages when implemented
  }, []);

  // Fetch Resume Meta
  const fetchResumeMeta = async () => {
    setIsLoadingResumeMeta(true);
    const { data, error } = await supabase.from('resume_meta').select('*').eq('id', RESUME_META_ID).maybeSingle();
    if (error) {
      toast({ title: "Error fetching resume meta", description: error.message, variant: "destructive" });
    } else if (data) {
      setResumeMeta(data);
      resumeMetaForm.reset({
        id: data.id,
        description: data.description || '',
        resume_pdf_url: data.resume_pdf_url || ''
      });
      setCurrentDbResumePdfUrl(data.resume_pdf_url || null);
    } else {
      // No data found, ensure form is reset to defaults
      resumeMetaForm.reset({ id: RESUME_META_ID, description: '', resume_pdf_url: '' });
      setCurrentDbResumePdfUrl(null);
    }
    setIsLoadingResumeMeta(false);
  };

  // Resume Meta Submit
  const onResumeMetaSubmit: SubmitHandler<ResumeMetaFormData> = async (formData) => {
    let pdfUrlToSave = formData.resume_pdf_url;
    let oldPdfStoragePathToDelete: string | null = null;

    if (currentDbResumePdfUrl) {
        const pathParts = currentDbResumePdfUrl.split('/resume-pdfs/');
        if (pathParts.length > 1 && !pathParts[1].startsWith('http')) {
            oldPdfStoragePathToDelete = pathParts[1];
        }
    }

    if (resumePdfFile) {
      const fileName = `resume_${Date.now()}.${resumePdfFile.name.split('.').pop()}`;
      toast({ title: "Uploading Resume PDF", description: "Please wait..." });
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resume-pdfs')
        .upload(fileName, resumePdfFile, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        console.error("Error uploading Resume PDF:", JSON.stringify(uploadError, null, 2));
        toast({ title: "Upload Error", description: `Failed to upload PDF: ${uploadError.message}`, variant: "destructive" });
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('resume-pdfs').getPublicUrl(fileName);
      if (!publicUrlData?.publicUrl) {
        toast({ title: "Error", description: "Failed to get public URL for uploaded PDF.", variant: "destructive" });
        return;
      }
      pdfUrlToSave = publicUrlData.publicUrl;
    }
    
    const dataForUpsert = {
      ...formData,
      id: RESUME_META_ID,
      resume_pdf_url: pdfUrlToSave || null,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase.from('resume_meta').upsert(dataForUpsert, { onConflict: 'id' });

    if (upsertError) {
      console.error("Error saving resume info:", JSON.stringify(upsertError, null, 2));
      toast({ title: "Error", description: `Failed to save resume info: ${upsertError.message}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Resume info saved." });
      if (oldPdfStoragePathToDelete && pdfUrlToSave !== currentDbResumePdfUrl) {
        console.log("[ResumeManager] Attempting to delete old resume PDF from storage:", oldPdfStoragePathToDelete);
        const { error: storageDeleteError } = await supabase.storage.from('resume-pdfs').remove([oldPdfStoragePathToDelete]);
        if (storageDeleteError) {
          console.warn("[ResumeManager] Error deleting old resume PDF:", JSON.stringify(storageDeleteError, null, 2));
          toast({title: "Storage Warning", description: `Updated resume info, but failed to delete old PDF: ${storageDeleteError.message}`, variant: "default"});
        } else {
          console.log("[ResumeManager] Old resume PDF successfully deleted:", oldPdfStoragePathToDelete);
        }
      }
      fetchResumeMeta();
      setResumePdfFile(null);
      router.refresh();
    }
  };
  
  const handleResumePdfFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setResumePdfFile(event.target.files[0]);
      resumeMetaForm.setValue('resume_pdf_url', ''); // Clear URL if file chosen
    } else {
      setResumePdfFile(null);
    }
  };


  // Fetch Experiences
  const fetchExperiences = async () => {
    setIsLoadingExperiences(true);
    const { data, error } = await supabase.from('resume_experience').select('*').order('sort_order', { ascending: true });
    if (error) toast({ title: "Error fetching experiences", description: error.message, variant: "destructive" });
    else setExperiences(data || []);
    setIsLoadingExperiences(false);
  };

  // Experience Submit
  const onExperienceSubmit: SubmitHandler<ResumeExperienceFormData> = async (formData) => {
    const dataToSave = { ...formData, description_points: formData.description_points || [], icon_image_url: formData.icon_image_url?.trim() === '' ? null : formData.icon_image_url, };
    let response;
    if (formData.id) response = await supabase.from('resume_experience').update(dataToSave).eq('id', formData.id).select();
    else { const { id, ...insertData } = dataToSave; response = await supabase.from('resume_experience').insert(insertData).select(); }
    
    if (response.error) {
      toast({ title: "Error saving experience", description: response.error.message, variant: "destructive" });
    } else { 
      toast({ title: "Success", description: "Experience saved." }); 
      fetchExperiences(); 
      setIsExperienceModalOpen(false); 
      router.refresh(); 
    }
  };
  
  // Experience Delete
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
    setExperienceToDelete(null); // Close confirmation dialog
  };
  
  // Experience Modal Open
  const handleOpenExperienceModal = (experience?: ResumeExperience) => {
    setCurrentExperience(experience || null);
    experienceForm.reset(experience ? { 
      ...experience, 
      description_points: experience.description_points?.join('\n') || '' 
    } : { job_title: '', company_name: '', date_range: '', description_points: [], icon_image_url: '', sort_order: 0 });
    setIsExperienceModalOpen(true);
  };

  // Fetch Education Items
  const fetchEducationItems = async () => {
    setIsLoadingEducation(true);
    const { data, error } = await supabase.from('resume_education').select('*').order('sort_order', { ascending: true });
    if (error) {
      toast({ title: "Error fetching education items", description: error.message, variant: "destructive" });
    } else {
      setEducationItems(data || []);
    }
    setIsLoadingEducation(false);
  };

  // Education Submit
  const onEducationSubmit: SubmitHandler<ResumeEducationFormData> = async (formData) => {
    const dataToSave = { ...formData, icon_image_url: formData.icon_image_url?.trim() === '' ? null : formData.icon_image_url, };
    let response;
    if (formData.id) {
      response = await supabase.from('resume_education').update(dataToSave).eq('id', formData.id).select();
    } else { 
      const { id, ...insertData } = dataToSave; 
      response = await supabase.from('resume_education').insert(insertData).select(); 
    }
    
    if (response.error) {
      toast({ title: "Error saving education item", description: response.error.message, variant: "destructive" });
    } else { 
      toast({ title: "Success", description: "Education item saved." }); 
      fetchEducationItems(); 
      setIsEducationModalOpen(false); 
      router.refresh(); 
    }
  };
  
  // Education Delete
  const handleDeleteEducation = async () => {
    if (!educationToDelete) return;
    const { error } = await supabase.from('resume_education').delete().eq('id', educationToDelete.id);
    if (error) {
      toast({ title: "Error deleting education item", description: error.message, variant: "destructive" });
    } else { 
      toast({ title: "Success", description: "Education item deleted." }); 
      fetchEducationItems(); 
      router.refresh(); 
    }
    setEducationToDelete(null); // Close confirmation dialog
  };

  // Education Modal Open
  const handleOpenEducationModal = (education?: ResumeEducation) => {
    setCurrentEducation(education || null);
    educationForm.reset(education || { degree_or_certification: '', institution_name: '', date_range: '', description: '', icon_image_url: '', sort_order: 0 });
    setIsEducationModalOpen(true);
  };


  return (
    <>
      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Manage General Resume Info
            <ResumeIcon className="h-6 w-6 text-primary" />
          </CardTitle>
          <CardDescription>Update the overall resume description and downloadable PDF file.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingResumeMeta ? <p className="text-center text-muted-foreground">Loading resume info...</p> : (
            <form onSubmit={resumeMetaForm.handleSubmit(onResumeMetaSubmit)} className="grid gap-6 py-4">
              <div>
                <Label htmlFor="resumeDescription">Overall Resume Description</Label>
                <Textarea id="resumeDescription" {...resumeMetaForm.register("description")} rows={4} placeholder="A brief summary or objective for your resume..." />
                {resumeMetaForm.formState.errors.description && <p className="text-destructive text-sm mt-1">{resumeMetaForm.formState.errors.description.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="resume_pdf_file">Resume PDF File</Label>
                <div className="flex items-center gap-3">
                    <Input id="resume_pdf_file" type="file" accept=".pdf" onChange={handleResumePdfFileChange} className="flex-grow"/>
                    <UploadCloud className="h-6 w-6 text-muted-foreground"/>
                </div>
                {resumePdfFile && <p className="text-sm text-muted-foreground mt-1">New file selected: {resumePdfFile.name}</p>}
                {currentDbResumePdfUrl && !resumePdfFile && (
                  <div className="mt-2 text-sm">
                    Current PDF: <a href={currentDbResumePdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center"><LinkIcon className="mr-1 h-4 w-4" />View/Download</a>
                  </div>
                )}
                 <div>
                  <Label htmlFor="resume_pdf_url_manual" className="text-xs text-muted-foreground">Or enter direct PDF URL (upload will override)</Label>
                  <Input id="resume_pdf_url_manual" {...resumeMetaForm.register("resume_pdf_url")} placeholder="https://example.com/your-resume.pdf" />
                  {resumeMetaForm.formState.errors.resume_pdf_url && <p className="text-destructive text-sm mt-1">{resumeMetaForm.formState.errors.resume_pdf_url.message}</p>}
                </div>
              </div>
              <Button type="submit" className="w-full sm:w-auto justify-self-start">Save Resume Info</Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Manage Resume Sections
            <ListChecks className="h-6 w-6 text-primary" />
          </CardTitle>
          <CardDescription>Update your professional experience, education, skills, and languages.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="experience" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
              <TabsTrigger value="experience"><Briefcase className="mr-2 h-4 w-4" />Experience</TabsTrigger>
              <TabsTrigger value="education"><GraduationCap className="mr-2 h-4 w-4" />Education</TabsTrigger>
              <TabsTrigger value="skills" disabled><ListChecks className="mr-2 h-4 w-4" />Key Skills (Soon)</TabsTrigger>
              <TabsTrigger value="languages" disabled><LanguagesIcon className="mr-2 h-4 w-4" />Languages (Soon)</TabsTrigger>
            </TabsList>

            <TabsContent value="experience">
              <div className="text-right mb-4">
                <Button onClick={() => handleOpenExperienceModal()}><PlusCircle className="mr-2 h-4 w-4" /> Add Experience</Button>
              </div>
              {isLoadingExperiences ? <p className="text-center text-muted-foreground">Loading experiences...</p> : experiences.length === 0 ? <p className="text-muted-foreground text-center py-4">No experience entries yet.</p> : (
                <div className="space-y-4">
                  {experiences.map((exp) => (
                    <Card key={exp.id} className="p-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-3 flex-grow min-w-0">
                           <IconPreview url={exp.icon_image_url} alt={exp.job_title} />
                          <div className="flex-grow min-w-0">
                            <h4 className="font-semibold text-lg truncate" title={exp.job_title}>{exp.job_title}</h4>
                            <p className="text-sm text-muted-foreground truncate" title={`${exp.company_name} (${exp.date_range || ''})`}>{exp.company_name} ({exp.date_range || 'Date N/A'})</p>
                          </div>
                        </div>
                        <div className="flex space-x-2 flex-shrink-0">
                          <Button variant="outline" size="sm" onClick={() => handleOpenExperienceModal(exp)}><Edit className="mr-1 h-3 w-3" />Edit</Button>
                          <Button variant="destructive" size="sm" onClick={() => setExperienceToDelete(exp)}><Trash2 className="mr-1 h-3 w-3" />Delete</Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="education">
              <div className="text-right mb-4">
                <Button onClick={() => handleOpenEducationModal()}><PlusCircle className="mr-2 h-4 w-4" /> Add Education</Button>
              </div>
              {isLoadingEducation ? <p className="text-center text-muted-foreground">Loading education items...</p> : educationItems.length === 0 ? <p className="text-muted-foreground text-center py-4">No education entries yet.</p> : (
                <div className="space-y-4">
                  {educationItems.map((edu) => (
                    <Card key={edu.id} className="p-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-3 flex-grow min-w-0">
                           <IconPreview url={edu.icon_image_url} alt={edu.degree_or_certification} />
                          <div className="flex-grow min-w-0">
                            <h4 className="font-semibold text-lg truncate" title={edu.degree_or_certification}>{edu.degree_or_certification}</h4>
                            <p className="text-sm text-muted-foreground truncate" title={`${edu.institution_name} (${edu.date_range || ''})`}>{edu.institution_name} ({edu.date_range || 'Date N/A'})</p>
                          </div>
                        </div>
                        <div className="flex space-x-2 flex-shrink-0">
                          <Button variant="outline" size="sm" onClick={() => handleOpenEducationModal(edu)}><Edit className="mr-1 h-3 w-3" />Edit</Button>
                          <Button variant="destructive" size="sm" onClick={() => setEducationToDelete(edu)}><Trash2 className="mr-1 h-3 w-3" />Delete</Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="skills"><p className="text-center text-muted-foreground py-8">Key Skills management coming soon.</p></TabsContent>
            <TabsContent value="languages"><p className="text-center text-muted-foreground py-8">Languages management coming soon.</p></TabsContent>
          </Tabs>

          {/* Experience Modal */}
          <Dialog open={isExperienceModalOpen} onOpenChange={(isOpen) => { setIsExperienceModalOpen(isOpen); if (!isOpen) setCurrentExperience(null); }}>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader><DialogTitle>{currentExperience ? 'Edit Experience' : 'Add New Experience'}</DialogTitle></DialogHeader>
              <form onSubmit={experienceForm.handleSubmit(onExperienceSubmit)} className="grid gap-4 py-4">
                <ScrollArea className="max-h-[70vh] p-1"><div className="grid gap-4 p-3">
                  <div><Label htmlFor="job_title">Job Title</Label><Input id="job_title" {...experienceForm.register("job_title")} />{experienceForm.formState.errors.job_title && <p className="text-destructive text-sm mt-1">{experienceForm.formState.errors.job_title.message}</p>}</div>
                  <div><Label htmlFor="company_name">Company Name</Label><Input id="company_name" {...experienceForm.register("company_name")} />{experienceForm.formState.errors.company_name && <p className="text-destructive text-sm mt-1">{experienceForm.formState.errors.company_name.message}</p>}</div>
                  <div><Label htmlFor="exp_date_range">Date Range (e.g., Jan 2023 - Present)</Label><Input id="exp_date_range" {...experienceForm.register("date_range")} /></div>
                  <div><Label htmlFor="description_points">Description (one point per line)</Label><Textarea id="description_points" {...experienceForm.register("description_points")} rows={5} /></div>
                  <div><Label htmlFor="exp_icon_image_url">Icon Image URL (Optional)</Label><Input id="exp_icon_image_url" {...experienceForm.register("icon_image_url")} placeholder="https://example.com/icon.png" />{experienceForm.formState.errors.icon_image_url && <p className="text-destructive text-sm mt-1">{experienceForm.formState.errors.icon_image_url.message}</p>}
                    {experienceForm.watch("icon_image_url") && (<div className="mt-2 flex items-center gap-2"><span className="text-xs">Preview:</span><IconPreview url={experienceForm.watch("icon_image_url")} /></div>)}
                  </div>
                  <div><Label htmlFor="exp_sort_order">Sort Order</Label><Input id="exp_sort_order" type="number" {...experienceForm.register("sort_order")} /></div>
                </div></ScrollArea>
                <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit">{currentExperience ? 'Save Changes' : 'Add Experience'}</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          {/* Experience Delete Confirmation */}
          <AlertDialog open={!!experienceToDelete} onOpenChange={() => setExperienceToDelete(null)}>
            <AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground">
              <AlertDialogHeader><AlertDialogTitle className="text-destructive-foreground">Delete Experience: {experienceToDelete?.job_title}?</AlertDialogTitle><AlertDialogDescription className="text-destructive-foreground/90">This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteExperience} className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90")}>Delete</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          {/* Education Modal */}
          <Dialog open={isEducationModalOpen} onOpenChange={(isOpen) => { setIsEducationModalOpen(isOpen); if (!isOpen) setCurrentEducation(null); }}>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader><DialogTitle>{currentEducation ? 'Edit Education' : 'Add New Education'}</DialogTitle></DialogHeader>
              <form onSubmit={educationForm.handleSubmit(onEducationSubmit)} className="grid gap-4 py-4">
                <ScrollArea className="max-h-[70vh] p-1"><div className="grid gap-4 p-3">
                  <div><Label htmlFor="degree_or_certification">Degree or Certification</Label><Input id="degree_or_certification" {...educationForm.register("degree_or_certification")} />{educationForm.formState.errors.degree_or_certification && <p className="text-destructive text-sm mt-1">{educationForm.formState.errors.degree_or_certification.message}</p>}</div>
                  <div><Label htmlFor="institution_name">Institution Name</Label><Input id="institution_name" {...educationForm.register("institution_name")} />{educationForm.formState.errors.institution_name && <p className="text-destructive text-sm mt-1">{educationForm.formState.errors.institution_name.message}</p>}</div>
                  <div><Label htmlFor="edu_date_range">Date Range (e.g., 2020 - 2024)</Label><Input id="edu_date_range" {...educationForm.register("date_range")} /></div>
                  <div><Label htmlFor="edu_description">Description (Optional)</Label><Textarea id="edu_description" {...educationForm.register("description")} rows={3} /></div>
                  <div><Label htmlFor="edu_icon_image_url">Icon Image URL (Optional)</Label><Input id="edu_icon_image_url" {...educationForm.register("icon_image_url")} placeholder="https://example.com/school-logo.png" />{educationForm.formState.errors.icon_image_url && <p className="text-destructive text-sm mt-1">{educationForm.formState.errors.icon_image_url.message}</p>}
                     {educationForm.watch("icon_image_url") && (<div className="mt-2 flex items-center gap-2"><span className="text-xs">Preview:</span><IconPreview url={educationForm.watch("icon_image_url")} /></div>)}
                  </div>
                  <div><Label htmlFor="edu_sort_order">Sort Order</Label><Input id="edu_sort_order" type="number" {...educationForm.register("sort_order")} /></div>
                </div></ScrollArea>
                <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit">{currentEducation ? 'Save Changes' : 'Add Education'}</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          {/* Education Delete Confirmation */}
          <AlertDialog open={!!educationToDelete} onOpenChange={() => setEducationToDelete(null)}>
            <AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground">
              <AlertDialogHeader><AlertDialogTitle className="text-destructive-foreground">Delete Education: {educationToDelete?.degree_or_certification}?</AlertDialogTitle><AlertDialogDescription className="text-destructive-foreground/90">This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteEducation} className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90")}>Delete</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </TabsContent>
      </Card>
    </>
  );
}

    