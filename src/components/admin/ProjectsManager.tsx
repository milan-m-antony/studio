
"use client";

import React, { useEffect, useState, type FormEvent, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import type { Project, ProjectStatus } from '@/types/supabase';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { Progress } from '@/components/ui/progress';

const projectSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  image_url: z.string().url("Must be a valid URL if provided, or will be set by upload.").optional().or(z.literal("")),
  live_demo_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  repo_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  tags: z.string().transform(val => val.split(',').map(tag => tag.trim()).filter(tag => tag)),
  status: z.enum(['Deployed', 'In Progress', 'Prototype', 'Archived', 'Concept', 'Completed']),
  progress: z.coerce.number().min(0).max(100).optional().nullable(),
});
type ProjectFormData = z.infer<typeof projectSchema>;

interface MappedProject extends Project {
  tagsInput: string; // For the form input
}

export default function ProjectsManager() {
  const router = useRouter();
  const { toast } = useToast();

  const [projects, setProjects] = useState<MappedProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<MappedProject | null>(null);
  const [showProjectDeleteConfirm, setShowProjectDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<MappedProject | null>(null);
  const [projectImageFile, setProjectImageFile] = useState<File | null>(null);
  const [projectImagePreview, setProjectImagePreview] = useState<string | null>(null);

  const projectForm = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: { title: '', description: '', image_url: '', live_demo_url: '', repo_url: '', tags: [], status: 'Concept', progress: null }
  });

  const currentProjectImageUrlForPreview = projectForm.watch('image_url');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (projectImageFile) {
      const reader = new FileReader();
      reader.onloadend = () => setProjectImagePreview(reader.result as string);
      reader.readAsDataURL(projectImageFile);
    } else if (currentProject?.imageUrl) {
      setProjectImagePreview(currentProject.imageUrl);
    } else if (projectForm.getValues('image_url')) {
       setProjectImagePreview(projectForm.getValues('image_url'));
    }
     else {
      setProjectImagePreview(null);
    }
  }, [projectImageFile, currentProject, currentProjectImageUrlForPreview, projectForm]);

  useEffect(() => {
    if (currentProject) {
      projectForm.reset({
        id: currentProject.id,
        title: currentProject.title,
        description: currentProject.description || '',
        image_url: currentProject.imageUrl || '',
        live_demo_url: currentProject.liveDemoUrl || '',
        repo_url: currentProject.repoUrl || '',
        tags: currentProject.tagsInput,
        status: currentProject.status || 'Concept',
        progress: currentProject.progress === null || currentProject.progress === undefined ? null : Number(currentProject.progress),
      });
      setProjectImageFile(null);
    } else {
      projectForm.reset({ title: '', description: '', image_url: '', live_demo_url: '', repo_url: '', tags: [], status: 'Concept', progress: null });
      setProjectImageFile(null);
      setProjectImagePreview(null);
    }
  }, [currentProject, projectForm]);

  const fetchProjects = async () => {
    setIsLoadingProjects(true);
    const { data, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching projects:', JSON.stringify(fetchError, null, 2));
      toast({ title: "Error", description: `Could not fetch projects: ${fetchError.message}`, variant: "destructive" });
      setProjects([]);
    } else if (data) {
      const mappedData: MappedProject[] = data.map(p => ({
        ...p, // Spread all properties from Supabase row
        id: p.id,
        title: p.title,
        description: p.description,
        imageUrl: p.image_url,
        liveDemoUrl: p.live_demo_url,
        repoUrl: p.repo_url,
        tags: p.tags || [], // Ensure tags is an array
        status: p.status as ProjectStatus | null,
        progress: p.progress,
        created_at: p.created_at,
        tagsInput: (p.tags || []).join(', '), // For form editing
      }));
      setProjects(mappedData);
    } else {
      setProjects([]);
    }
    setIsLoadingProjects(false);
  };

  const handleProjectImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setProjectImageFile(event.target.files[0]);
      projectForm.setValue('image_url', ''); // Clear URL if file is chosen
    } else {
      setProjectImageFile(null);
    }
  };

  const onProjectSubmit: SubmitHandler<ProjectFormData> = async (formData) => {
    let imageUrlToSave = formData.image_url;

    if (projectImageFile) {
      const fileExt = projectImageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `projects/${fileName}`;
      toast({ title: "Uploading Project Image", description: "Please wait...", variant: "default" });
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(filePath, projectImageFile, { cacheControl: '3600', upsert: !!formData.id });

      if (uploadError) {
        console.error("Error uploading project image:", JSON.stringify(uploadError, null, 2));
        toast({ title: "Upload Error", description: `Failed to upload project image: ${uploadError.message}`, variant: "destructive" });
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('project-images').getPublicUrl(filePath);
      if (!publicUrlData?.publicUrl) {
        toast({ title: "Error", description: "Failed to get public URL for uploaded project image.", variant: "destructive" });
        return;
      }
      imageUrlToSave = publicUrlData.publicUrl;
    }

    const projectDataToSave = {
      ...formData, // Includes title, description, status, progress, and TRANSFORMED tags (now an array)
      image_url: imageUrlToSave || null,
      live_demo_url: formData.live_demo_url || null,
      repo_url: formData.repo_url || null,
      progress: formData.progress === undefined || formData.progress === null ? null : Number(formData.progress),
    };
    // Remove the 'tags' string field if it exists from Zod (it was already transformed)
    // The 'tags' in projectDataToSave is already an array from formData
    // const { tags: tagsString, ...dataForDb } = projectDataToSave;

    if (formData.id) { // Update existing project
      const { error: updateError } = await supabase
        .from('projects')
        .update(projectDataToSave)
        .eq('id', formData.id);
      if (updateError) {
        console.error("Error updating project:", JSON.stringify(updateError, null, 2));
        toast({ title: "Error", description: `Failed to update project: ${updateError.message}`, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Project updated successfully." });
      }
    } else { // Add new project
      const { id, ...dataToInsert } = projectDataToSave; // remove id for insert
      const { error: insertError } = await supabase
        .from('projects')
        .insert(dataToInsert as any);
      if (insertError) {
        console.error("Error adding project (raw Supabase error object):", JSON.stringify(insertError, null, 2));
        toast({ title: "Error", description: `Failed to add project: ${insertError.message || 'Supabase returned an error without a specific message. Check RLS policies or console for details.'}`, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Project added successfully." });
      }
    }
    fetchProjects();
    setIsProjectModalOpen(false);
    setProjectImageFile(null);
    projectForm.reset();
    router.refresh();
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    console.log("[AdminDashboard] Deleting project ID:", projectToDelete.id);

    if (projectToDelete.imageUrl) {
      const imagePath = projectToDelete.imageUrl.substring(projectToDelete.imageUrl.indexOf('/project-images/') + '/project-images/'.length);
      if (imagePath && !imagePath.startsWith('http')) {
        console.log("[AdminDashboard] Deleting image from storage:", imagePath);
        const { error: storageError } = await supabase.storage.from('project-images').remove([imagePath]);
        if (storageError) {
          console.warn("[AdminDashboard] Error deleting project image from storage, proceeding with DB delete:", JSON.stringify(storageError, null, 2));
        }
      }
    }

    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectToDelete.id);

    if (deleteError) {
      console.error("[AdminDashboard] Error deleting project from DB:", JSON.stringify(deleteError, null, 2));
      toast({ title: "Error", description: `Failed to delete project: ${deleteError.message || 'An unexpected error occurred.'}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Project deleted successfully." });
      fetchProjects();
      router.refresh();
    }
    setShowProjectDeleteConfirm(false);
    setProjectToDelete(null);
  };

  const triggerDeleteConfirmation = (project: MappedProject) => { setProjectToDelete(project); setShowProjectDeleteConfirm(true); };
  const handleOpenProjectModal = (project?: MappedProject) => { setCurrentProject(project || null); setIsProjectModalOpen(true); };

  return (
    <Card className="mb-8 shadow-lg">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">Manage Projects
          <Dialog open={isProjectModalOpen} onOpenChange={(isOpen) => { setIsProjectModalOpen(isOpen); if (!isOpen) { setCurrentProject(null); setProjectImageFile(null); projectForm.reset(); } }}>
            <DialogTrigger asChild><Button onClick={() => handleOpenProjectModal()}><PlusCircle className="mr-2 h-4 w-4" /> Add Project</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader><DialogTitle>{currentProject?.id ? 'Edit Project' : 'Add New Project'}</DialogTitle></DialogHeader>
              <form onSubmit={projectForm.handleSubmit(onProjectSubmit)} className="grid gap-4 py-4 max-h-[80vh] overflow-y-auto p-2 scrollbar-hide">
                <div><Label htmlFor="title">Title</Label><Input id="title" {...projectForm.register("title")} />{projectForm.formState.errors.title && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.title.message}</p>}</div>
                <div><Label htmlFor="description">Description</Label><Textarea id="description" {...projectForm.register("description")} />{projectForm.formState.errors.description && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.description.message}</p>}</div>
                <div className="space-y-2">
                  <Label htmlFor="project_image_file">Project Image File</Label>
                  <div className="flex items-center gap-3"><Input id="project_image_file" type="file" accept="image/*" onChange={handleProjectImageFileChange} className="flex-grow" /><UploadCloud className="h-6 w-6 text-muted-foreground" /></div>
                  {(projectImagePreview) && (<div className="mt-2 p-2 border rounded-md bg-muted aspect-video relative w-full max-w-xs mx-auto"><Image src={projectImagePreview} alt="Image preview" fill objectFit="contain" className="rounded" /></div>)}
                  <div><Label htmlFor="image_url_project" className="text-xs text-muted-foreground">Or enter Image URL (upload will override)</Label><Input id="image_url_project" {...projectForm.register("image_url")} placeholder="https://example.com/image.png" />{projectForm.formState.errors.image_url && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.image_url.message}</p>}</div>
                </div>
                <div><Label htmlFor="live_demo_url">Live Demo URL</Label><Input id="live_demo_url" {...projectForm.register("live_demo_url")} placeholder="https://example.com/demo" />{projectForm.formState.errors.live_demo_url && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.live_demo_url.message}</p>}</div>
                <div><Label htmlFor="repo_url">Repository URL</Label><Input id="repo_url" {...projectForm.register("repo_url")} placeholder="https://github.com/user/repo" />{projectForm.formState.errors.repo_url && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.repo_url.message}</p>}</div>
                <div><Label htmlFor="tags">Tags (comma-separated)</Label><Input id="tags" {...projectForm.register("tags")} placeholder="React, Next.js, Supabase" /></div>
                <div><Label htmlFor="status">Status</Label><select id="status" {...projectForm.register("status")} className="w-full p-2 border rounded-md bg-background text-sm focus:ring-ring focus:border-input">{(['Concept', 'Prototype', 'In Progress', 'Completed', 'Deployed', 'Archived'] as ProjectStatus[]).map(s => (<option key={s} value={s}>{s}</option>))} </select></div>
                <div><Label htmlFor="progress">Progress (0-100, for 'In Progress')</Label><Input id="progress" type="number" {...projectForm.register("progress", { setValueAs: (v) => (v === '' || v === null || v === undefined ? null : Number(v)) })} />{projectForm.formState.errors.progress && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.progress.message}</p>}</div>
                <DialogFooter><DialogClose asChild><Button type="button" variant="outline" onClick={() => { setProjectImageFile(null); projectForm.reset(); }}>Cancel</Button></DialogClose><Button type="submit">{currentProject?.id ? 'Save Changes' : 'Add Project'}</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoadingProjects ? <p className="text-center text-muted-foreground">Loading projects...</p> : (projects.length === 0 ? (<p className="text-center text-muted-foreground py-8">No projects found. Add one to get started!</p>) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <Card key={project.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 hover:shadow-md transition-shadow">
                {project.imageUrl && (<div className="w-24 h-16 relative mr-4 mb-2 sm:mb-0 flex-shrink-0 rounded overflow-hidden border"><Image src={project.imageUrl} alt={project.title} layout="fill" objectFit="cover" /></div>)}
                <div className="flex-grow mb-3 sm:mb-0">
                  <h4 className="font-semibold text-lg">{project.title}</h4>
                  <p className="text-sm text-muted-foreground">Status: <span className={`font-medium ${project.status === 'Deployed' ? 'text-green-600' : project.status === 'In Progress' ? 'text-blue-600' : 'text-gray-600'}`}>{project.status}</span>{project.status === 'In Progress' && project.progress != null && ` (${project.progress}%)`}</p>
                  {project.tags && project.tags.length > 0 && (<p className="text-xs text-muted-foreground mt-1">Tags: {project.tags.join(', ')}</p>)}
                   {project.status === 'In Progress' && project.progress !== null && project.progress !== undefined && (
                    <div className="mt-2">
                        <Progress value={project.progress} className="h-2 w-full sm:w-1/2 md:w-1/3" aria-label={`${project.progress}% complete`} />
                    </div>
                    )}
                </div>
                <div className="flex space-x-2 self-start sm:self-center shrink-0">
                  <Button variant="outline" size="sm" onClick={() => handleOpenProjectModal(project)}><Edit className="mr-1.5 h-3.5 w-3.5" /> Edit</Button>
                   <Button variant="destructive" size="sm" onClick={() => triggerDeleteConfirmation(project)}>
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                    </Button>
                </div>
              </Card>
            ))}</div>
        ))}
      </CardContent>
      <AlertDialog open={showProjectDeleteConfirm} onOpenChange={setShowProjectDeleteConfirm}>
        <AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive-foreground">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-destructive-foreground/90">This action cannot be undone. This will permanently delete the project "{projectToDelete?.title}".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowProjectDeleteConfirm(false); setProjectToDelete(null); }} className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground", "hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive", "hover:bg-destructive-foreground/90")}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

    