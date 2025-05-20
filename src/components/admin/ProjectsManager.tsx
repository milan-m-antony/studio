
"use client";

import React, { useEffect, useState, type FormEvent, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, PlusCircle, Edit, Trash2, Briefcase } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';

const projectSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").optional().or(z.literal("")),
  image_url: z.string().url("Must be a valid URL if provided, or will be set by upload.").optional().or(z.literal("")).nullable(),
  live_demo_url: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  repo_url: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  tags: z.string().transform(val => val.split(',').map(tag => tag.trim()).filter(Boolean)),
  status: z.enum(['Deployed', 'In Progress', 'Prototype', 'Archived', 'Concept', 'Completed']),
  progress: z.coerce.number().min(0).max(100).optional().nullable(),
});
type ProjectFormData = z.infer<typeof projectSchema>;


export default function ProjectsManager() {
  const router = useRouter();
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentDbProjectImageUrl, setCurrentDbProjectImageUrl] = useState<string | null>(null);
  const [showProjectDeleteConfirm, setShowProjectDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectImageFile, setProjectImageFile] = useState<File | null>(null);
  const [projectImagePreview, setProjectImagePreview] = useState<string | null>(null);

  const projectForm = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: { title: '', description: '', image_url: '', live_demo_url: '', repo_url: '', tags: '', status: 'Concept', progress: 0 }
  });

  const currentProjectImageUrlForForm = projectForm.watch('image_url');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    let newPreviewUrl: string | null = null;
    if (projectImageFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviewUrl = reader.result as string;
        setProjectImagePreview(newPreviewUrl);
      };
      reader.readAsDataURL(projectImageFile);
      return; 
    } else if (currentProjectImageUrlForForm && currentProjectImageUrlForForm.trim() !== '') {
      newPreviewUrl = currentProjectImageUrlForForm;
    } else if (currentDbProjectImageUrl) {
      newPreviewUrl = currentDbProjectImageUrl;
    }
    setProjectImagePreview(newPreviewUrl);
  }, [projectImageFile, currentProjectImageUrlForForm, currentDbProjectImageUrl]);


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
      const mappedData: Project[] = data.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description || null,
        imageUrl: p.image_url || null, // Mapped for client-side use
        liveDemoUrl: p.live_demo_url || null, // Mapped
        repoUrl: p.repo_url || null, // Mapped
        tags: p.tags || [],
        status: p.status as ProjectStatus | null || 'Concept',
        progress: p.progress === null || p.progress === undefined ? null : Number(p.progress),
        created_at: p.created_at,
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
      projectForm.setValue('image_url', ''); 
    } else {
      setProjectImageFile(null);
      const formUrl = projectForm.getValues('image_url');
      setProjectImagePreview(formUrl && formUrl.trim() !== '' ? formUrl : currentDbProjectImageUrl || null);
    }
  };

  const onProjectSubmit: SubmitHandler<ProjectFormData> = async (formData) => {
    let imageUrlToSaveInDb = formData.image_url; 
    let oldImageStoragePathToDelete: string | null = null;
    const existingProjectImageUrlForDeletion = currentProject?.imageUrl;


    if (existingProjectImageUrlForDeletion) {
        try {
            const url = new URL(existingProjectImageUrlForDeletion);
            if (url.pathname.includes('/project-images/')) {
                const pathParts = url.pathname.split('/project-images/');
                if (pathParts.length > 1 && !pathParts[1].startsWith('http')) { 
                    oldImageStoragePathToDelete = pathParts[1];
                }
            }
        } catch (e) {
            console.warn("[ProjectsManager] Could not parse existingProjectImageUrlForDeletion for old path:", existingProjectImageUrlForDeletion);
        }
    }
    
    if (projectImageFile) {
      const fileExt = projectImageFile.name.split('.').pop();
      const fileName = `project_${Date.now()}.${fileExt}`; 
      const filePath = `${fileName}`; 

      toast({ title: "Uploading Project Image", description: "Please wait..." });
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-images') 
        .upload(filePath, projectImageFile, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        console.error("Error uploading project image:", JSON.stringify(uploadError, null, 2));
        toast({ title: "Upload Error", description: `Failed to upload project image: ${uploadError.message}`, variant: "destructive" });
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('project-images').getPublicUrl(filePath);
      if (!publicUrlData?.publicUrl) {
        toast({ title: "Error", description: "Failed to get public URL for uploaded image.", variant: "destructive" });
        return;
      }
      imageUrlToSaveInDb = publicUrlData.publicUrl;
    } else if (formData.image_url === '' && existingProjectImageUrlForDeletion) {
        // User cleared the URL field and there was an existing image
        imageUrlToSaveInDb = null; // Ensure DB is updated to null
    }
    
    const dataForSupabase = {
      title: formData.title,
      description: formData.description || null,
      image_url: imageUrlToSaveInDb || null,
      live_demo_url: formData.live_demo_url || null,
      repo_url: formData.repo_url || null,
      tags: formData.tags || [], 
      status: formData.status,
      progress: formData.progress === undefined || formData.progress === null ? null : Number(formData.progress),
    };
    
    let upsertResponse;
    if (formData.id) { 
      upsertResponse = await supabase
        .from('projects')
        .update(dataForSupabase)
        .eq('id', formData.id)
        .select()
        .single();
      if (upsertResponse.error) {
        console.error("Error updating project:", JSON.stringify(upsertResponse.error, null, 2));
        toast({ title: "Error", description: `Failed to update project: ${upsertResponse.error.message}`, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Project updated successfully." });
         await supabase.from('admin_activity_log').insert({
            action_type: 'PROJECT_UPDATED',
            description: `Project "${formData.title}" was updated.`,
            user_identifier: process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin',
            details: { projectId: formData.id }
          });
        // Delete old image from storage if a new one was uploaded OR if the URL was cleared
        if (oldImageStoragePathToDelete && (projectImageFile || imageUrlToSaveInDb !== existingProjectImageUrlForDeletion)) {
            console.log("[ProjectsManager] Attempting to delete old project image from storage:", oldImageStoragePathToDelete);
            const { error: storageDeleteError } = await supabase.storage.from('project-images').remove([oldImageStoragePathToDelete]);
            if (storageDeleteError) console.warn("[ProjectsManager] Error deleting old project image from storage:", JSON.stringify(storageDeleteError, null, 2));
        }
      }
    } else { 
      upsertResponse = await supabase
        .from('projects')
        .insert(dataForSupabase)
        .select()
        .single();
      if (upsertResponse.error) {
        console.error("Error adding project (raw Supabase error object):", JSON.stringify(upsertResponse.error, null, 2));
        toast({ title: "Error", description: `Failed to add project: ${upsertResponse.error.message || 'Supabase returned an error. Check RLS or console.'}`, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Project added successfully." });
         if (upsertResponse.data) {
          await supabase.from('admin_activity_log').insert({
            action_type: 'PROJECT_CREATED',
            description: `Project "${formData.title}" was created.`,
            user_identifier: process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin',
            details: { projectId: upsertResponse.data.id }
          });
        }
      }
    }

    if (!upsertResponse.error) {
        fetchProjects();
        setIsProjectModalOpen(false);
        setProjectImageFile(null); 
        router.refresh();
    }
  };
  
  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    console.log("[AdminDashboard][ProjectsManager] Deleting project ID:", projectToDelete.id);
    
    if (projectToDelete.imageUrl) {
        const imagePath = projectToDelete.imageUrl.substring(projectToDelete.imageUrl.indexOf('/project-images/') + '/project-images/'.length);
        if (imagePath && !imagePath.startsWith('http')) {
            console.log("[AdminDashboard][ProjectsManager] Deleting image from storage:", imagePath);
            const { error: storageError } = await supabase.storage.from('project-images').remove([imagePath]);
            if (storageError) {
                console.warn("[AdminDashboard][ProjectsManager] Error deleting project image from storage, proceeding with DB delete:", JSON.stringify(storageError, null, 2));
            }
        }
    }
    
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectToDelete.id);

    if (deleteError) {
      console.error("[AdminDashboard][ProjectsManager] Error deleting project from DB:", JSON.stringify(deleteError, null, 2));
      toast({ title: "Error", description: `Failed to delete project: ${deleteError.message || 'An unexpected error occurred.'}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Project deleted successfully." });
       await supabase.from('admin_activity_log').insert({
        action_type: 'PROJECT_DELETED',
        description: `Project "${projectToDelete.title}" was deleted.`,
        user_identifier: process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin',
        details: { projectId: projectToDelete.id }
      });
      fetchProjects();
    }
    setShowProjectDeleteConfirm(false);
    setProjectToDelete(null);
    router.refresh(); 
  };

  const triggerDeleteConfirmation = (project: Project) => {
    setProjectToDelete(project);
    setShowProjectDeleteConfirm(true);
  };

  const handleOpenProjectModal = (project?: Project) => {
    if (project) {
      setCurrentProject(project);
      setCurrentDbProjectImageUrl(project.imageUrl || null); // Store DB image URL for comparison on save
      projectForm.reset({
        id: project.id,
        title: project.title,
        description: project.description || '',
        image_url: project.imageUrl || '',
        live_demo_url: project.liveDemoUrl || '',
        repo_url: project.repoUrl || '',
        tags: (project.tags || []).join(', '),
        status: project.status || 'Concept',
        progress: project.progress === null || project.progress === undefined ? null : Number(project.progress),
      });
      setProjectImagePreview(project.imageUrl || null);
    } else {
      setCurrentProject(null);
      setCurrentDbProjectImageUrl(null);
      projectForm.reset({ title: '', description: '', image_url: '', live_demo_url: '', repo_url: '', tags: '', status: 'Concept', progress: 0 });
      setProjectImageFile(null);
      setProjectImagePreview(null);
    }
    setIsProjectModalOpen(true);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Manage Projects
          <Briefcase className="h-6 w-6 text-primary" />
        </CardTitle>
        <CardDescription>Add, edit, or delete your portfolio projects.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 text-right">
          <Button onClick={() => handleOpenProjectModal()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Project
          </Button>
        </div>

        {isLoadingProjects ? (
          <p className="text-center text-muted-foreground">Loading projects...</p>
        ) : projects.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No projects found. Add one to get started!</p>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <Card key={project.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 hover:shadow-md transition-shadow">
                 <div className="flex items-center gap-4 w-full sm:w-auto">
                    {project.imageUrl && (
                        <div className="w-24 h-16 relative mr-0 sm:mr-4 mb-2 sm:mb-0 flex-shrink-0 rounded overflow-hidden border bg-muted">
                        <Image src={project.imageUrl} alt={project.title || "Project image"} fill className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                        </div>
                    )}
                    <div className="flex-grow mb-3 sm:mb-0 min-w-0">
                        <h4 className="font-semibold text-lg truncate" title={project.title}>{project.title}</h4>
                        <p className="text-sm text-muted-foreground">Status: <span className={`font-medium ${project.status === 'Deployed' ? 'text-green-600 dark:text-green-400' : project.status === 'In Progress' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>{project.status}</span>{project.status === 'In Progress' && project.progress != null && ` (${project.progress}%)`}</p>
                        {project.tags && project.tags.length > 0 && (<p className="text-xs text-muted-foreground mt-1 truncate" title={(project.tags || []).join(', ')}>Tags: {(project.tags || []).join(', ')}</p>)}
                        {project.status === 'In Progress' && project.progress !== null && project.progress !== undefined && (
                        <div className="mt-2">
                            <Progress value={project.progress} className="h-2 w-full sm:w-1/2 md:w-1/3" aria-label={`${project.progress}% complete`} />
                        </div>
                        )}
                    </div>
                </div>
                <div className="flex space-x-2 self-start sm:self-center shrink-0 mt-2 sm:mt-0">
                  <Button variant="outline" size="sm" onClick={() => handleOpenProjectModal(project)}><Edit className="mr-1.5 h-3.5 w-3.5" /> Edit</Button>
                   <Button variant="destructive" size="sm" onClick={() => triggerDeleteConfirmation(project)}>
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                    </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={isProjectModalOpen} onOpenChange={(isOpen) => { setIsProjectModalOpen(isOpen); if (!isOpen) { setCurrentProject(null); setCurrentDbProjectImageUrl(null); setProjectImageFile(null); projectForm.reset(); } }}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader><DialogTitle>{currentProject?.id ? 'Edit Project' : 'Add New Project'}</DialogTitle></DialogHeader>
          <form onSubmit={projectForm.handleSubmit(onProjectSubmit)} className="grid gap-4 py-4">
            <ScrollArea className="max-h-[70vh] p-1">
              <div className="grid gap-4 p-3">
                <div><Label htmlFor="title">Title</Label><Input id="title" {...projectForm.register("title")} />{projectForm.formState.errors.title && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.title.message}</p>}</div>
                <div><Label htmlFor="description">Description</Label><Textarea id="description" {...projectForm.register("description")} />{projectForm.formState.errors.description && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.description.message}</p>}</div>
                <div className="space-y-2">
                  <Label htmlFor="project_image_file">Project Image File</Label>
                  <div className="flex items-center gap-3"><Input id="project_image_file" type="file" accept="image/*" onChange={handleProjectImageFileChange} className="flex-grow" /><UploadCloud className="h-6 w-6 text-muted-foreground" /></div>
                  {projectImagePreview && (<div className="mt-2 p-2 border rounded-md bg-muted aspect-video relative w-full max-w-xs mx-auto"><Image src={projectImagePreview} alt="Image preview" fill className="object-contain rounded"/></div>)}
                  <div><Label htmlFor="image_url_project" className="text-xs text-muted-foreground">Or enter Image URL (upload will override)</Label><Input id="image_url_project" {...projectForm.register("image_url")} placeholder="https://example.com/image.png" />{projectForm.formState.errors.image_url && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.image_url.message}</p>}</div>
                </div>
                <div><Label htmlFor="live_demo_url">Live Demo URL</Label><Input id="live_demo_url" {...projectForm.register("live_demo_url")} placeholder="https://example.com/demo" />{projectForm.formState.errors.live_demo_url && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.live_demo_url.message}</p>}</div>
                <div><Label htmlFor="repo_url">Repository URL</Label><Input id="repo_url" {...projectForm.register("repo_url")} placeholder="https://github.com/user/repo" />{projectForm.formState.errors.repo_url && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.repo_url.message}</p>}</div>
                <div><Label htmlFor="tags">Tags (comma-separated)</Label><Input id="tags" {...projectForm.register("tags")} placeholder="React, Next.js, Supabase" /></div>
                <div><Label htmlFor="status">Status</Label>
                  <select id="status" {...projectForm.register("status")} className={cn("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50")}>
                    {(['Concept', 'Prototype', 'In Progress', 'Completed', 'Deployed', 'Archived'] as ProjectStatus[]).map(s => (<option key={s} value={s}>{s}</option>))}
                  </select>
                </div>
                <div><Label htmlFor="progress">Progress (0-100, for 'In Progress')</Label><Input id="progress" type="number" {...projectForm.register("progress", { setValueAs: (v) => (v === '' || v === null || v === undefined ? null : Number(v)) })} />{projectForm.formState.errors.progress && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.progress.message}</p>}</div>
              </div>
            </ScrollArea>
            <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                <DialogClose asChild><Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button></DialogClose>
                <Button type="submit" className="w-full sm:w-auto">{currentProject?.id ? 'Save Changes' : 'Add Project'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showProjectDeleteConfirm} onOpenChange={setShowProjectDeleteConfirm}>
        <AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive-foreground">Delete Project: {projectToDelete?.title}?</AlertDialogTitle>
            <AlertDialogDescription className="text-destructive-foreground/90">This action cannot be undone. This will permanently delete the project and its image (if any).</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowProjectDeleteConfirm(false); setProjectToDelete(null); }} className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground", "hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive", "hover:bg-destructive-foreground/90")}>Delete Project</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

