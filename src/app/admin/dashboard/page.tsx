
"use client";

import React, { useEffect, useState, type FormEvent, type ChangeEvent } from 'next/navigation';
import { useRouter } from 'next/navigation';
import SectionWrapper from '@/components/ui/SectionWrapper';
import SectionTitle from '@/components/ui/SectionTitle';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck, LogOut, AlertTriangle, LogIn, PlusCircle, Edit, Trash2, Home, UploadCloud, Eye, Tag, Lightbulb, Palette, GripVertical, Package as DefaultCategoryIcon, Cpu as DefaultSkillIcon, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import type { Project, ProjectStatus, SkillCategory, Skill as SkillType } from '@/types/supabase';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import * as LucideIcons from 'lucide-react';


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

type CurrentProjectEditState = Omit<Project, 'tags' | 'created_at' | 'imageUrl' | 'liveDemoUrl' | 'repoUrl'> & {
    tags: string;
    imageUrl?: string | null;
    liveDemoUrl?: string | null;
    repoUrl?: string | null;
    created_at?: string;
};

const skillCategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Category name must be at least 2 characters"),
  icon_image_url: z.string().url("Must be a valid URL if provided, or will be set by upload.").optional().or(z.literal("")),
  sort_order: z.coerce.number().optional().nullable(),
});
type SkillCategoryFormData = z.infer<typeof skillCategorySchema>;

const skillSchema = z.object({
  id: z.string().uuid().optional(),
  category_id: z.string().uuid("Category ID is required"),
  name: z.string().min(2, "Skill name must be at least 2 characters"),
  icon_image_url: z.string().url("Must be a valid URL if provided, or will be set by upload.").optional().or(z.literal("")),
  description: z.string().optional().nullable(),
});
type SkillFormData = z.infer<typeof skillSchema>;

type SkillCategoryAdminState = Omit<SkillCategory, 'iconImageUrl'> & {
  iconImageUrl?: string | null;
  skills: SkillType[];
};


export default function AdminDashboardPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticatedForRender, setIsAuthenticatedForRender] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<CurrentProjectEditState | null>(null);
  const { toast } = useToast();

  const [showProjectDeleteConfirm, setShowProjectDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const [projectImageFile, setProjectImageFile] = useState<File | null>(null);
  const [projectImagePreview, setProjectImagePreview] = useState<string | null>(null);

  const [skillCategories, setSkillCategories] = useState<SkillCategoryAdminState[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<(SkillCategoryFormData & { id?: string }) | null>(null);
  const [showCategoryDeleteConfirm, setShowCategoryDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<SkillCategoryAdminState | null>(null);
  const [categoryIconFile, setCategoryIconFile] = useState<File | null>(null);
  // const [categoryIconPreviewComponent, setCategoryIconPreviewComponent] = useState<React.ReactNode | null>(null);


  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [currentSkill, setCurrentSkill] = useState<(SkillFormData & {id?: string}) | null>(null);
  const [parentCategoryIdForNewSkill, setParentCategoryIdForNewSkill] = useState<string | null>(null);
  const [showSkillDeleteConfirm, setShowSkillDeleteConfirm] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<SkillType | null>(null);
  const [skillIconFile, setSkillIconFile] = useState<File | null>(null);
  // const [skillIconPreviewComponent, setSkillIconPreviewComponent] = useState<React.ReactNode | null>(null);


  const projectForm = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
        title: '', description: '', image_url: '', live_demo_url: '', repo_url: '', tags: '', status: 'Concept', progress: null,
      }
  });

  const categoryForm = useForm<SkillCategoryFormData>({
    resolver: zodResolver(skillCategorySchema),
    defaultValues: { name: '', icon_image_url: '', sort_order: 0 }
  });

  const skillForm = useForm<SkillFormData>({
    resolver: zodResolver(skillSchema),
    defaultValues: { category_id: '', name: '', icon_image_url: '', description: '' }
  });

  const currentProjectImageUrlForPreview = projectForm.watch('image_url');
  const currentCategoryIconUrlForPreview = categoryForm.watch('icon_image_url');
  const currentSkillIconUrlForPreview = skillForm.watch('icon_image_url');

  // const currentCategoryIconName = categoryForm.watch('icon_name');
  // const currentSkillIconName = skillForm.watch('icon_name');

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const authStatus = localStorage.getItem('isAdminAuthenticated') === 'true';
      setIsAuthenticatedForRender(authStatus);
      if (authStatus) {
        fetchProjects();
        fetchSkillCategories();
      }
    }
  }, []);

  useEffect(() => {
    if (projectImageFile) {
      const reader = new FileReader();
      reader.onloadend = () => setProjectImagePreview(reader.result as string);
      reader.readAsDataURL(projectImageFile);
    } else if (currentProject?.imageUrl) {
      setProjectImagePreview(currentProject.imageUrl);
    } else {
      setProjectImagePreview(null);
    }
  }, [projectImageFile, currentProject]);

  const categoryIconPreview = currentCategoryIconUrlForPreview || (categoryIconFile ? URL.createObjectURL(categoryIconFile) : null);
  const skillIconPreview = currentSkillIconUrlForPreview || (skillIconFile ? URL.createObjectURL(skillIconFile) : null);


  useEffect(() => {
    if (currentProject) {
      projectForm.setValue('id', currentProject.id);
      projectForm.setValue('title', currentProject.title);
      projectForm.setValue('description', currentProject.description || '');
      projectForm.setValue('image_url', currentProject.imageUrl || '');
      projectForm.setValue('live_demo_url', currentProject.liveDemoUrl || '');
      projectForm.setValue('repo_url', currentProject.repoUrl || '');
      projectForm.setValue('tags', currentProject.tags); // Should already be a string here
      projectForm.setValue('status', currentProject.status || 'Concept');
      projectForm.setValue('progress', currentProject.progress === null || currentProject.progress === undefined ? null : Number(currentProject.progress));
      setProjectImageFile(null);
      setProjectImagePreview(currentProject.imageUrl || null);
    } else {
      projectForm.reset({
        title: '', description: '', image_url: '', live_demo_url: '', repo_url: '', tags: '', status: 'Concept', progress: null,
      });
      setProjectImageFile(null); setProjectImagePreview(null);
    }
  }, [currentProject, projectForm]);


  useEffect(() => {
    if (currentCategory) {
      categoryForm.reset({
        id: currentCategory.id,
        name: currentCategory.name,
        icon_image_url: currentCategory.icon_image_url || '',
        sort_order: currentCategory.sort_order === null || currentCategory.sort_order === undefined ? 0 : Number(currentCategory.sort_order),
      });
      setCategoryIconFile(null);
    } else {
      categoryForm.reset({ name: '', icon_image_url: '', sort_order: 0 });
      setCategoryIconFile(null);
    }
  }, [currentCategory, categoryForm]);

  useEffect(() => {
    if (currentSkill) {
      skillForm.reset({
        id: currentSkill.id,
        category_id: currentSkill.category_id || parentCategoryIdForNewSkill || '',
        name: currentSkill.name,
        icon_image_url: currentSkill.icon_image_url || '',
        description: currentSkill.description || '',
      });
      setSkillIconFile(null);
    } else {
      skillForm.reset({ category_id: parentCategoryIdForNewSkill || '', name: '', icon_image_url: '', description: ''});
      setSkillIconFile(null);
    }
  }, [currentSkill, parentCategoryIdForNewSkill, skillForm]);

  // // Effect for Category Icon Preview - COMMENTING OUT
  // useEffect(() => {
  //   if (currentCategoryIconName) {
  //     const Icon = LucideIcons[currentCategoryIconName as keyof typeof LucideIcons] as React.ElementType | undefined;
  //     if (Icon && typeof Icon === 'function') {
  //       setCategoryIconPreviewComponent(() => <Icon className="h-8 w-8 text-foreground" />);
  //     } else {
  //       setCategoryIconPreviewComponent(null);
  //     }
  //   } else {
  //     setCategoryIconPreviewComponent(null);
  //   }
  // }, [currentCategoryIconName]);

  // // Effect for Skill Icon Preview - COMMENTING OUT
  // useEffect(() => {
  //   if (currentSkillIconName) {
  //     const Icon = LucideIcons[currentSkillIconName as keyof typeof LucideIcons] as React.ElementType | undefined;
  //     if (Icon && typeof Icon === 'function') {
  //       setSkillIconPreviewComponent(() => <Icon className="h-8 w-8 text-foreground" />);
  //     } else {
  //       setSkillIconPreviewComponent(null);
  //     }
  //   } else {
  //     setSkillIconPreviewComponent(null);
  //   }
  // }, [currentSkillIconName]);


  const fetchProjects = async () => {
    setIsLoadingProjects(true);
    const { data, error: fetchError } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (fetchError) {
      console.error('Error fetching projects (raw Supabase error object):', JSON.stringify(fetchError, null, 2));
      toast({ title: "Error", description: `Could not fetch projects: ${fetchError.message || 'Supabase error.'}`, variant: "destructive" });
      setProjects([]);
    } else if (data) {
       const mappedProjects: Project[] = data.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        imageUrl: p.image_url, // Map snake_case to camelCase
        liveDemoUrl: p.live_demo_url, // Map snake_case to camelCase
        repoUrl: p.repo_url, // Map snake_case to camelCase
        tags: p.tags,
        status: p.status as ProjectStatus,
        progress: p.progress,
        created_at: p.created_at,
      }));
      setProjects(mappedProjects);
    } else { setProjects([]); }
    setIsLoadingProjects(false);
  };

  const fetchSkillCategories = async () => {
    setIsLoadingSkills(true);
    const { data, error: fetchError } = await supabase
      .from('skill_categories')
      .select('*, skills (*)') // skills will also have icon_image_url
      .order('sort_order', { ascending: true })
      .order('created_at', { foreignTable: 'skills', ascending: true });

    if (fetchError) {
      console.error('Error fetching skill categories:', JSON.stringify(fetchError, null, 2));
      toast({ title: "Error", description: `Could not fetch skills: ${fetchError.message || 'Supabase error.'}`, variant: "destructive" });
      setSkillCategories([]);
    } else if (data) {
      const mappedCategories: SkillCategoryAdminState[] = data.map(cat => ({
        id: cat.id,
        name: cat.name,
        iconImageUrl: cat.icon_image_url, // Mapped for category
        sort_order: cat.sort_order,
        skills: (cat.skills || []).map((sk: any) => ({
            id: sk.id,
            name: sk.name,
            iconImageUrl: sk.icon_image_url, // Mapped for skill
            description: sk.description,
            categoryId: sk.category_id
        })) as SkillType[],
      }));
      setSkillCategories(mappedCategories);
    } else { setSkillCategories([]); }
    setIsLoadingSkills(false);
  };


  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault(); setError('');
    const correctUsername = "milanmantony2002@gmail.com"; const correctPassword = "Ma@#9746372046";
    const trimmedUsername = username.trim(); const trimmedPassword = password.trim();
    if (trimmedUsername === correctUsername && trimmedPassword === correctPassword) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('isAdminAuthenticated', 'true');
        window.dispatchEvent(new CustomEvent('authChange'));
      }
      setIsAuthenticatedForRender(true); fetchProjects(); fetchSkillCategories();
    } else { setError("Invalid username or password."); setIsAuthenticatedForRender(false); }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isAdminAuthenticated');
      window.dispatchEvent(new CustomEvent('authChange'));
    }
    setIsAuthenticatedForRender(false); setUsername(''); setPassword(''); setProjects([]); setSkillCategories([]);
  };

  const handleProjectImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0]; setProjectImageFile(file);
      projectForm.setValue('image_url', ''); // Clear URL if file is chosen
    } else {
      setProjectImageFile(null);
      // Optionally reset preview if no file, or keep existing URL's preview
      if (currentProject?.imageUrl) setProjectImagePreview(currentProject.imageUrl); else setProjectImagePreview(null);
    }
  };

  const handleCategoryIconFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
        const file = event.target.files[0];
        setCategoryIconFile(file);
        categoryForm.setValue('icon_image_url', ''); // Clear URL if file is chosen
    } else {
        setCategoryIconFile(null);
    }
  };

  const handleSkillIconFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
        const file = event.target.files[0];
        setSkillIconFile(file);
        skillForm.setValue('icon_image_url', ''); // Clear URL if file is chosen
    } else {
        setSkillIconFile(null);
    }
  };


  const onProjectSubmit: SubmitHandler<ProjectFormData> = async (formData) => {
    let imageUrlToSave = formData.image_url;

    if (projectImageFile) {
      const fileExt = projectImageFile.name.split('.').pop(); const fileName = `${Date.now()}.${fileExt}`; const filePath = `${fileName}`;
      toast({ title: "Uploading Project Image", description: "Please wait...", variant: "default" });
      const { data: uploadData, error: uploadError } = await supabase.storage.from('project-images').upload(filePath, projectImageFile, { cacheControl: '3600', upsert: false });
      if (uploadError) {
        console.error("Error uploading project image:", JSON.stringify(uploadError, null, 2));
        toast({ title: "Upload Error", description: `Failed to upload project image: ${uploadError.message}`, variant: "destructive" }); return;
      }
      const { data: publicUrlData } = supabase.storage.from('project-images').getPublicUrl(filePath);
      if (!publicUrlData?.publicUrl) { toast({ title: "Error", description: "Failed to get public URL for uploaded project image.", variant: "destructive" }); return; }
      imageUrlToSave = publicUrlData.publicUrl;
    }

    const projectDataToSave = {
      title: formData.title, description: formData.description, image_url: imageUrlToSave || null,
      live_demo_url: formData.live_demo_url || null, repo_url: formData.repo_url || null,
      tags: formData.tags, status: formData.status,
      progress: formData.status === 'In Progress' && formData.progress !== undefined && formData.progress !== null ? Number(formData.progress) : null,
    };

    if (currentProject?.id) {
      const { error: updateError } = await supabase.from('projects').update(projectDataToSave).eq('id', currentProject.id);
      if (updateError) { console.error("Error updating project (raw Supabase error object):", JSON.stringify(updateError, null, 2)); toast({ title: "Error", description: `Failed to update project: ${updateError.message || 'Supabase error.'}`, variant: "destructive" }); }
      else { toast({ title: "Success", description: "Project updated successfully." }); }
    } else {
      const { error: insertError } = await supabase.from('projects').insert(projectDataToSave as any);
      if (insertError) { console.error("Error adding project (raw Supabase error object):", JSON.stringify(insertError, null, 2)); toast({ title: "Error", description: `Failed to add project: ${insertError.message || 'Supabase returned an error without a specific message. Check RLS policies or console for details.'}`, variant: "destructive" }); }
      else { toast({ title: "Success", description: "Project added successfully." }); }
    }
    setIsProjectModalOpen(false); setCurrentProject(null); setProjectImageFile(null); setProjectImagePreview(null);
    const fileInput = document.getElementById('project_image_file') as HTMLInputElement; if (fileInput) fileInput.value = '';
    fetchProjects(); router.refresh();
  };

  const handleDeleteProject = async () => {
    console.log("[AdminDashboard] handleDeleteProject called.");
    if (!projectToDelete) {
        console.warn("[AdminDashboard] No project selected for deletion.");
        toast({ title: "Warning", description: "No project selected for deletion.", variant: "default" });
        return;
    }
    console.log(`[AdminDashboard] Attempting to delete project ID: ${projectToDelete.id}`);
    console.log("[AdminDashboard] User confirmed delete. Proceeding with Supabase call...");

    const { error: deleteError } = await supabase.from('projects').delete().eq('id', projectToDelete.id);

    if (deleteError) {
        console.error("[AdminDashboard] Error deleting project (raw Supabase error object):", JSON.stringify(deleteError, null, 2));
        toast({ title: "Error", description: `Failed to delete project: ${deleteError.message || 'Supabase error.'}`, variant: "destructive" });
    } else {
        console.log("[AdminDashboard] Project deleted successfully from Supabase.");
        toast({ title: "Success", description: "Project deleted successfully." });
        fetchProjects();
        router.refresh();
    }
    setShowProjectDeleteConfirm(false);
    setProjectToDelete(null);
};

const triggerDeleteConfirmation = (project: Project) => {
    setProjectToDelete(project);
    setShowProjectDeleteConfirm(true);
};

  const handleOpenProjectModal = (project?: Project) => {
    setCurrentProject(project ? { ...project, tags: (Array.isArray(project.tags) ? project.tags.join(', ') : (project.tags || '')), } : null);
    setIsProjectModalOpen(true);
  };

  const onCategorySubmit: SubmitHandler<SkillCategoryFormData> = async (formData) => {
    let iconUrlToSave = formData.icon_image_url;

    if (categoryIconFile) {
        const fileExt = categoryIconFile.name.split('.').pop();
        const fileName = `${Date.now()}_category_icon.${fileExt}`;
        const filePath = `${fileName}`;
        toast({ title: "Uploading Category Icon", description: "Please wait...", variant: "default" });
        const { data: uploadData, error: uploadError } = await supabase.storage.from('category-icons').upload(filePath, categoryIconFile, { cacheControl: '3600', upsert: false });
        if (uploadError) {
            console.error("Error uploading category icon:", JSON.stringify(uploadError, null, 2));
            toast({ title: "Upload Error", description: `Failed to upload category icon: ${uploadError.message}`, variant: "destructive" });
            return;
        }
        const { data: publicUrlData } = supabase.storage.from('category-icons').getPublicUrl(filePath);
        if (!publicUrlData?.publicUrl) {
            toast({ title: "Error", description: "Failed to get public URL for uploaded category icon.", variant: "destructive" });
            return;
        }
        iconUrlToSave = publicUrlData.publicUrl;
    }

    const categoryData = {
      name: formData.name,
      icon_image_url: iconUrlToSave || null, // Save the URL
      sort_order: Number(formData.sort_order || 0)
    };

    if (currentCategory?.id) {
      const { error } = await supabase.from('skill_categories').update(categoryData).eq('id', currentCategory.id);
      if (error) { toast({ title: "Error", description: `Failed to update category: ${error.message}`, variant: "destructive" }); }
      else { toast({ title: "Success", description: "Category updated." }); }
    } else {
      const { error } = await supabase.from('skill_categories').insert(categoryData);
      if (error) { toast({ title: "Error", description: `Failed to add category: ${error.message}`, variant: "destructive" }); }
      else { toast({ title: "Success", description: "Category added." }); }
    }
    setIsCategoryModalOpen(false); setCurrentCategory(null); setCategoryIconFile(null);
    const categoryIconInput = document.getElementById('category_icon_file') as HTMLInputElement;
    if (categoryIconInput) categoryIconInput.value = '';
    fetchSkillCategories(); router.refresh();
  };

  const handleOpenCategoryModal = (category?: SkillCategoryAdminState) => {
    if (category) {
        setCurrentCategory({
            id: category.id,
            name: category.name,
            icon_image_url: category.iconImageUrl || '',
            sort_order: category.sort_order || 0,
        });
    } else {
        setCurrentCategory(null);
    }
    setIsCategoryModalOpen(true);
  };

  const triggerCategoryDeleteConfirmation = (category: SkillCategoryAdminState) => {
    setCategoryToDelete(category); setShowCategoryDeleteConfirm(true);
  };

  const performDeleteCategory = async (categoryId: string) => {
    const { error } = await supabase.from('skill_categories').delete().eq('id', categoryId);
    if (error) { toast({ title: "Error", description: `Failed to delete category: ${error.message}`, variant: "destructive" }); }
    else { toast({ title: "Success", description: "Category deleted." }); fetchSkillCategories(); router.refresh(); }
    setShowCategoryDeleteConfirm(false); setCategoryToDelete(null);
  };

  const onSkillSubmit: SubmitHandler<SkillFormData> = async (formData) => {
    let iconUrlToSave = formData.icon_image_url;

    if (skillIconFile) {
        const fileExt = skillIconFile.name.split('.').pop();
        const fileName = `${Date.now()}_skill_icon.${fileExt}`;
        const filePath = `${fileName}`;
        toast({ title: "Uploading Skill Icon", description: "Please wait...", variant: "default" });
        const { data: uploadData, error: uploadError } = await supabase.storage.from('skill-icons').upload(filePath, skillIconFile, { cacheControl: '3600', upsert: false });
        if (uploadError) {
            console.error("Error uploading skill icon:", JSON.stringify(uploadError, null, 2));
            toast({ title: "Upload Error", description: `Failed to upload skill icon: ${uploadError.message}`, variant: "destructive" });
            return;
        }
        const { data: publicUrlData } = supabase.storage.from('skill-icons').getPublicUrl(filePath);
        if (!publicUrlData?.publicUrl) {
            toast({ title: "Error", description: "Failed to get public URL for uploaded skill icon.", variant: "destructive" });
            return;
        }
        iconUrlToSave = publicUrlData.publicUrl;
    }

    const skillDataToSave = {
        category_id: formData.category_id,
        name: formData.name,
        icon_image_url: iconUrlToSave || null, // Save the URL
        description: formData.description || null,
    };

    if (currentSkill?.id) {
      const { error } = await supabase.from('skills').update(skillDataToSave).eq('id', currentSkill.id);
      if (error) { toast({ title: "Error", description: `Failed to update skill: ${error.message}`, variant: "destructive" }); }
      else { toast({ title: "Success", description: "Skill updated." }); }
    } else {
      const { error } = await supabase.from('skills').insert(skillDataToSave);
      if (error) { toast({ title: "Error", description: `Failed to add skill: ${error.message}`, variant: "destructive" }); }
      else { toast({ title: "Success", description: "Skill added." }); }
    }
    setIsSkillModalOpen(false); setCurrentSkill(null); setParentCategoryIdForNewSkill(null); setSkillIconFile(null);
    const skillIconInput = document.getElementById('skill_icon_file') as HTMLInputElement;
    if (skillIconInput) skillIconInput.value = '';
    fetchSkillCategories(); router.refresh();
  };

  const handleOpenSkillModal = (category_id: string, skill?: SkillType) => {
    setParentCategoryIdForNewSkill(category_id);
    if (skill) {
        setCurrentSkill({
            id: skill.id,
            category_id: skill.categoryId || category_id,
            name: skill.name,
            icon_image_url: skill.iconImageUrl || '',
            description: skill.description || '',
        });
    } else {
        setCurrentSkill(null);
    }
    skillForm.setValue('category_id', category_id);
    setIsSkillModalOpen(true);
  };

  const triggerSkillDeleteConfirmation = (skill: SkillType) => {
    setSkillToDelete(skill); setShowSkillDeleteConfirm(true);
  };

  const performDeleteSkill = async (skillId: string) => {
    const { error } = await supabase.from('skills').delete().eq('id', skillId);
    if (error) { toast({ title: "Error", description: `Failed to delete skill: ${error.message}`, variant: "destructive" }); }
    else { toast({ title: "Success", description: "Skill deleted." }); fetchSkillCategories(); router.refresh(); }
    setShowSkillDeleteConfirm(false); setSkillToDelete(null);
  };


  if (!isMounted) {
    return (
      <SectionWrapper>
        <div className="flex justify-center items-center min-h-screen">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </SectionWrapper>
    );
  }

  if (!isAuthenticatedForRender) {
    return (
      <SectionWrapper className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/50">
        <Card className="w-full max-w-md shadow-2xl p-8">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary rounded-full inline-block">
                <ShieldCheck className="h-10 w-10 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-bold">Admin Access</CardTitle>
            <CardDescription>Please log in to manage portfolio content.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="your_email@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              {error && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Login Failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
              <Button type="submit" className="w-full text-lg py-3"><LogIn className="mr-2 h-5 w-5" /> Log In</Button>
            </form>
          </CardContent>
           <CardFooter className="mt-6 flex flex-col items-center space-y-2">
             <Button variant="link" asChild className="text-muted-foreground hover:text-primary">
                <Link href="/"><Home className="mr-2 h-4 w-4" />Back to Portfolio</Link>
            </Button>
          </CardFooter>
        </Card>
      </SectionWrapper>
    );
  }


  return (
    <SectionWrapper>
      <SectionTitle subtitle="Manage portfolio content.">Admin Dashboard</SectionTitle>
      <div className="flex justify-between items-center mb-6">
        <Button asChild className="mb-0">
            <Link href="/"><Home className="mr-2 h-4 w-4"/>Back to Portfolio</Link>
        </Button>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>

      {/* Projects Management Section */}
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Manage Projects
            <Dialog open={isProjectModalOpen} onOpenChange={(isOpen) => {
                setIsProjectModalOpen(isOpen);
                if (!isOpen) { setCurrentProject(null); setProjectImageFile(null); setProjectImagePreview(null); }
             }}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenProjectModal()}><PlusCircle className="mr-2 h-4 w-4" /> Add Project</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader><DialogTitle>{currentProject?.id ? 'Edit Project' : 'Add New Project'}</DialogTitle></DialogHeader>
                <form onSubmit={projectForm.handleSubmit(onProjectSubmit)} className="grid gap-4 py-4 max-h-[80vh] overflow-y-auto p-2 scrollbar-hide">
                  <div><Label htmlFor="title">Title</Label><Input id="title" {...projectForm.register("title")} />{projectForm.formState.errors.title && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.title.message}</p>}</div>
                  <div><Label htmlFor="description">Description</Label><Textarea id="description" {...projectForm.register("description")} />{projectForm.formState.errors.description && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.description.message}</p>}</div>
                  <div className="space-y-2">
                    <Label htmlFor="project_image_file">Project Image File</Label>
                    <div className="flex items-center gap-3"><Input id="project_image_file" type="file" accept="image/*" onChange={handleProjectImageFileChange} className="flex-grow" /><UploadCloud className="h-6 w-6 text-muted-foreground"/></div>
                    {(projectImagePreview || currentProjectImageUrlForPreview) && (<div className="mt-2 p-2 border rounded-md bg-muted aspect-video relative w-full max-w-xs mx-auto"><Image src={projectImagePreview || currentProjectImageUrlForPreview || "https://placehold.co/600x400.png"} alt="Image preview" fill objectFit="contain" className="rounded dark:filter dark:brightness-0 dark:invert"/></div>)}
                    <div><Label htmlFor="image_url" className="text-xs text-muted-foreground">Or enter Image URL (upload will override)</Label><Input id="image_url" {...projectForm.register("image_url")} placeholder="https://example.com/image.png" />{projectForm.formState.errors.image_url && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.image_url.message}</p>}</div>
                  </div>
                  <div><Label htmlFor="live_demo_url">Live Demo URL</Label><Input id="live_demo_url" {...projectForm.register("live_demo_url")} placeholder="https://example.com/demo" />{projectForm.formState.errors.live_demo_url && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.live_demo_url.message}</p>}</div>
                  <div><Label htmlFor="repo_url">Repository URL</Label><Input id="repo_url" {...projectForm.register("repo_url")} placeholder="https://github.com/user/repo" />{projectForm.formState.errors.repo_url && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.repo_url.message}</p>}</div>
                  <div><Label htmlFor="tags">Tags (comma-separated)</Label><Input id="tags" {...projectForm.register("tags" as any)} placeholder="React, Next.js, Supabase" /></div>
                  <div><Label htmlFor="status">Status</Label><select id="status" {...projectForm.register("status")} className="w-full p-2 border rounded-md bg-background text-sm focus:ring-ring focus:border-input">{(['Concept', 'Prototype', 'In Progress', 'Completed', 'Deployed', 'Archived'] as ProjectStatus[]).map(s => (<option key={s} value={s}>{s}</option>))} </select></div>
                  <div><Label htmlFor="progress">Progress (0-100, for 'In Progress')</Label><Input id="progress" type="number" {...projectForm.register("progress", {setValueAs: (v) => (v === '' || v === null || v === undefined ? null : Number(v))})} />{projectForm.formState.errors.progress && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.progress.message}</p>}</div>
                  <DialogFooter><DialogClose asChild><Button type="button" variant="outline" onClick={() => { setProjectImageFile(null); setProjectImagePreview(null);}}>Cancel</Button></DialogClose><Button type="submit">{currentProject?.id ? 'Save Changes' : 'Add Project'}</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingProjects ? <p className="text-center text-muted-foreground">Loading projects...</p> : (projects.length === 0 ? (<p className="text-center text-muted-foreground py-8">No projects found.</p>) : (
            <div className="space-y-4">
            {projects.map((project) => (
                <Card key={project.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 hover:shadow-md transition-shadow">
                  {project.imageUrl && (
                        <div className="w-24 h-16 relative mr-4 mb-2 sm:mb-0 flex-shrink-0 rounded overflow-hidden border">
                            <Image src={project.imageUrl} alt={project.title || 'Project Image'} layout="fill" objectFit="cover" className="dark:filter dark:brightness-0 dark:invert" />
                        </div>
                    )}
                  <div className="flex-grow mb-3 sm:mb-0">
                    <h4 className="font-semibold text-lg">{project.title}</h4>
                    <p className="text-sm text-muted-foreground">Status: <span className={`font-medium ${project.status === 'Deployed' ? 'text-green-600' : project.status === 'In Progress' ? 'text-blue-600' : 'text-gray-600'}`}>{project.status}</span>{project.status === 'In Progress' && project.progress != null && ` (${project.progress}%)`}</p>
                    {project.tags && (Array.isArray(project.tags) ? project.tags.length > 0 : (project.tags as string).length > 0) && (<p className="text-xs text-muted-foreground mt-1">Tags: {(Array.isArray(project.tags) ? project.tags.join(', ') : project.tags)}</p>)}
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
      </Card>
      <AlertDialog open={showProjectDeleteConfirm} onOpenChange={setShowProjectDeleteConfirm}>
        <AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground"><AlertDialogHeader><AlertDialogTitle className="text-destructive-foreground">Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription className="text-destructive-foreground/90">This action cannot be undone. This will permanently delete the project "{projectToDelete?.title}".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => { setShowProjectDeleteConfirm(false); setProjectToDelete(null);}} className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground", "hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteProject} className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive", "hover:bg-destructive-foreground/90")}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      {/* Skills Management Section */}
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Manage Skills
            <Button onClick={() => handleOpenCategoryModal()}><PlusCircle className="mr-2 h-4 w-4" /> Add Category</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSkills ? <p className="text-center text-muted-foreground">Loading skills...</p> : (
            skillCategories.length === 0 ? <p className="text-center text-muted-foreground py-8">No skill categories found. Add one to get started!</p> : (
              <Accordion type="multiple" className="w-full">
                {skillCategories.map(category => (
                  <AccordionItem value={category.id} key={category.id}>
                    <AccordionTrigger className="hover:bg-muted/50 px-4 py-3 rounded-md">
                      <div className="flex items-center gap-3">
                         {category.iconImageUrl && <Image src={category.iconImageUrl} alt={category.name} width={24} height={24} className="rounded-sm dark:filter dark:brightness-0 dark:invert"/>}
                         {!category.iconImageUrl && <DefaultCategoryIcon className="h-6 w-6 text-muted-foreground"/>}
                        <span className="font-medium text-lg">{category.name}</span>
                        <Badge variant="outline">{category.skills?.length || 0} skills</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="bg-muted/20 p-4 rounded-b-md">
                      <div className="flex justify-end space-x-2 mb-3">
                        <Button variant="outline" size="sm" onClick={() => handleOpenCategoryModal(category)}><Edit className="mr-1.5 h-3.5 w-3.5"/> Edit Category</Button>
                        <Button variant="destructive" size="sm" onClick={() => triggerCategoryDeleteConfirmation(category)}><Trash2 className="mr-1.5 h-3.5 w-3.5"/> Delete Category</Button>
                        <Button size="sm" onClick={() => handleOpenSkillModal(category.id)}><PlusCircle className="mr-1.5 h-3.5 w-3.5"/> Add Skill to {category.name}</Button>
                      </div>
                      {category.skills && category.skills.length > 0 ? (
                        <div className="space-y-2">
                          {category.skills.map(skill => (
                            <Card key={skill.id} className="p-3 flex justify-between items-center bg-card hover:shadow-sm">
                              <div className="flex items-center gap-2">
                                {skill.iconImageUrl && <Image src={skill.iconImageUrl} alt={skill.name} width={16} height={16} className="rounded-sm dark:filter dark:brightness-0 dark:invert"/>}
                                {!skill.iconImageUrl && <DefaultSkillIcon className="h-4 w-4 text-secondary-foreground/70"/>}
                                <div>
                                  <p className="font-medium">{skill.name}</p>
                                  {skill.description && <p className="text-xs text-muted-foreground">{skill.description}</p>}
                                </div>
                              </div>
                              <div className="flex space-x-1.5">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenSkillModal(category.id, skill)}><Edit className="h-4 w-4"/></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => triggerSkillDeleteConfirmation(skill)}><Trash2 className="h-4 w-4"/></Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : <p className="text-sm text-muted-foreground text-center py-3">No skills in this category yet.</p>}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )
          )}
        </CardContent>
      </Card>

      {/* Skill Category Modal */}
        <Dialog open={isCategoryModalOpen} onOpenChange={(isOpen) => {
            setIsCategoryModalOpen(isOpen);
            if (!isOpen) { setCurrentCategory(null); setCategoryIconFile(null); }
        }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{currentCategory?.id ? 'Edit Skill Category' : 'Add New Skill Category'}</DialogTitle></DialogHeader>
          <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="grid gap-4 py-4">
            <div><Label htmlFor="categoryName">Name</Label><Input id="categoryName" {...categoryForm.register("name")} />{categoryForm.formState.errors.name && <p className="text-destructive text-sm mt-1">{categoryForm.formState.errors.name.message}</p>}</div>
            <div className="space-y-2">
              <Label htmlFor="category_icon_file">Category Icon File</Label>
              <div className="flex items-center gap-3">
                <Input id="category_icon_file" type="file" accept="image/*" onChange={handleCategoryIconFileChange} className="flex-grow" />
                <UploadCloud className="h-6 w-6 text-muted-foreground"/>
              </div>
              {categoryIconPreview && (
                <div className="mt-2 p-2 border rounded-md bg-muted aspect-square relative w-24 h-24 mx-auto">
                  <Image src={categoryIconPreview} alt="Category icon preview" layout="fill" objectFit="contain" className="rounded dark:filter dark:brightness-0 dark:invert"/>
                </div>
              )}
               <div>
                <Label htmlFor="icon_image_url_category" className="text-xs text-muted-foreground">
                    Or enter Icon Image URL (upload will override).
                </Label>
                <Input id="icon_image_url_category" {...categoryForm.register("icon_image_url")} placeholder="https://example.com/icon.png" />
                {categoryForm.formState.errors.icon_image_url && <p className="text-destructive text-sm mt-1">{categoryForm.formState.errors.icon_image_url.message}</p>}
              </div>
            </div>
            <div><Label htmlFor="categorySortOrder">Sort Order</Label><Input id="categorySortOrder" type="number" {...categoryForm.register("sort_order")} /></div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" onClick={() => { setCategoryIconFile(null); }}>Cancel</Button></DialogClose>
                <Button type="submit">{currentCategory?.id ? 'Save Changes' : 'Add Category'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

       {/* Skill Modal */}
      <Dialog open={isSkillModalOpen} onOpenChange={(isOpen) => {
          setIsSkillModalOpen(isOpen);
          if (!isOpen) { setCurrentSkill(null); setParentCategoryIdForNewSkill(null); setSkillIconFile(null); }
      }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{currentSkill?.id ? 'Edit Skill' : 'Add New Skill'}</DialogTitle></DialogHeader>
          <form onSubmit={skillForm.handleSubmit(onSkillSubmit)} className="grid gap-4 py-4">
            <input type="hidden" {...skillForm.register("category_id")} />
            <div><Label htmlFor="skillName">Skill Name</Label><Input id="skillName" {...skillForm.register("name")} />{skillForm.formState.errors.name && <p className="text-destructive text-sm mt-1">{skillForm.formState.errors.name.message}</p>}</div>
             <div className="space-y-2">
              <Label htmlFor="skill_icon_file">Skill Icon File</Label>
              <div className="flex items-center gap-3">
                <Input id="skill_icon_file" type="file" accept="image/*" onChange={handleSkillIconFileChange} className="flex-grow" />
                <UploadCloud className="h-6 w-6 text-muted-foreground"/>
              </div>
              {skillIconPreview && (
                <div className="mt-2 p-2 border rounded-md bg-muted aspect-square relative w-24 h-24 mx-auto">
                  <Image src={skillIconPreview} alt="Skill icon preview" layout="fill" objectFit="contain" className="rounded dark:filter dark:brightness-0 dark:invert"/>
                </div>
              )}
               <div>
                 <Label htmlFor="icon_image_url_skill" className="text-xs text-muted-foreground">
                    Or enter Icon Image URL (upload will override).
                </Label>
                <Input id="icon_image_url_skill" {...skillForm.register("icon_image_url")} placeholder="https://example.com/icon.png" />
                {skillForm.formState.errors.icon_image_url && <p className="text-destructive text-sm mt-1">{skillForm.formState.errors.icon_image_url.message}</p>}
              </div>
            </div>
            <div><Label htmlFor="skillDescription">Description (Optional)</Label><Textarea id="skillDescription" {...skillForm.register("description")} /></div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" onClick={() => { setSkillIconFile(null); }}>Cancel</Button></DialogClose>
                <Button type="submit">{currentSkill?.id ? 'Save Changes' : 'Add Skill'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Delete Confirmation Modal */}
      <AlertDialog open={showCategoryDeleteConfirm} onOpenChange={setShowCategoryDeleteConfirm}>
         <AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground"><AlertDialogHeader><AlertDialogTitle className="text-destructive-foreground">Delete Category: {categoryToDelete?.name}?</AlertDialogTitle><AlertDialogDescription className="text-destructive-foreground/90">This will also delete all skills within this category. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => {setShowCategoryDeleteConfirm(false); setCategoryToDelete(null);}} className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => {if (categoryToDelete) performDeleteCategory(categoryToDelete.id);}} className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90")}>Delete Category</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      {/* Skill Delete Confirmation Modal */}
      <AlertDialog open={showSkillDeleteConfirm} onOpenChange={setShowSkillDeleteConfirm}>
         <AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground"><AlertDialogHeader><AlertDialogTitle className="text-destructive-foreground">Delete Skill: {skillToDelete?.name}?</AlertDialogTitle><AlertDialogDescription className="text-destructive-foreground/90">This action cannot be undone.</AlertDialogDescription></AlertDialogFooter><AlertDialogFooter><AlertDialogCancel onClick={() => {setShowSkillDeleteConfirm(false); setSkillToDelete(null);}} className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => {if (skillToDelete) performDeleteSkill(skillToDelete.id);}} className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90")}>Delete Skill</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <Card className="mb-8 shadow-lg">
        <CardHeader><CardTitle>Manage About Content (Coming Soon)</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Functionality to edit the About Me section content.</p></CardContent>
      </Card>
    </SectionWrapper>
  );
}

    