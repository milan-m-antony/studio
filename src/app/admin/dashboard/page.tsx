
"use client";

import React, { useEffect, useState, type FormEvent, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import SectionWrapper from '@/components/ui/SectionWrapper';
import SectionTitle from '@/components/ui/SectionTitle';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck, LogOut, AlertTriangle, LogIn, PlusCircle, Edit, Trash2, Home, UploadCloud, Package as DefaultCategoryIcon, Cpu as DefaultSkillIcon, UserCircle as AboutMeIcon, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import type { Project, ProjectStatus, SkillCategory, Skill as SkillType, AboutContent } from '@/types/supabase';
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


// Fixed ID for the single "About Me" content row in Supabase
const PRIMARY_ABOUT_CONTENT_ID = '00000000-0000-0000-0000-000000000001';

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


const skillCategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Category name must be at least 2 characters"),
  icon_image_url: z.string().url("Must be a valid URL if an image is uploaded or URL is provided.").optional().or(z.literal("")),
  sort_order: z.coerce.number().optional().nullable(),
});
type SkillCategoryFormData = z.infer<typeof skillCategorySchema>;


const skillSchema = z.object({
  id: z.string().uuid().optional(),
  category_id: z.string().uuid("Category ID is required"),
  name: z.string().min(2, "Skill name must be at least 2 characters"),
  icon_image_url: z.string().url("Must be a valid URL if an image is uploaded or URL is provided.").optional().or(z.literal("")),
  description: z.string().optional().nullable(),
});
type SkillFormData = z.infer<typeof skillSchema>;

const aboutContentSchema = z.object({
  id: z.string().uuid().default(PRIMARY_ABOUT_CONTENT_ID),
  headline_main: z.string().optional().nullable(),
  headline_code_keyword: z.string().optional().nullable(),
  headline_connector: z.string().optional().nullable(),
  headline_creativity_keyword: z.string().optional().nullable(),
  paragraph1: z.string().optional().nullable(),
  paragraph2: z.string().optional().nullable(),
  paragraph3: z.string().optional().nullable(),
  image_url: z.string().url("Must be a valid URL if provided, or will be set by upload.").optional().or(z.literal("")),
  image_tagline: z.string().optional().nullable(),
});
type AboutContentFormData = z.infer<typeof aboutContentSchema>;


interface MappedProject {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  liveDemoUrl: string | null;
  repoUrl: string | null;
  tags: string[] | null;
  status: ProjectStatus | null;
  progress: number | null;
  created_at: string;
}
interface MappedSkillCategory {
  id: string;
  name: string;
  iconImageUrl: string | null;
  sort_order: number | null;
  skills: SkillType[]; // Already MappedSkillType
  created_at: string;
}


export default function AdminDashboardPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticatedForRender, setIsAuthenticatedForRender] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();

  // Projects State
  const [projects, setProjects] = useState<MappedProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<(MappedProject & {tags: string}) | null>(null);
  const [showProjectDeleteConfirm, setShowProjectDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<MappedProject | null>(null);
  const [projectImageFile, setProjectImageFile] = useState<File | null>(null);
  const [projectImagePreview, setProjectImagePreview] = useState<string | null>(null);

  // Skill Categories State
  const [skillCategories, setSkillCategories] = useState<MappedSkillCategory[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<(MappedSkillCategory & { icon_image_url?: string }) | null>(null);
  const [showCategoryDeleteConfirm, setShowCategoryDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<MappedSkillCategory | null>(null);
  const [categoryIconFile, setCategoryIconFile] = useState<File | null>(null);
  const [categoryIconPreview, setCategoryIconPreview] = useState<string | null>(null);

  // Skills State
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [currentSkill, setCurrentSkill] = useState<(SkillType & { icon_image_url?: string }) | null>(null);
  const [parentCategoryIdForNewSkill, setParentCategoryIdForNewSkill] = useState<string | null>(null);
  const [showSkillDeleteConfirm, setShowSkillDeleteConfirm] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<SkillType | null>(null);
  const [skillIconFile, setSkillIconFile] = useState<File | null>(null);
  const [skillIconPreview, setSkillIconPreview] = useState<string | null>(null);

  // About Content State
  const [isLoadingAbout, setIsLoadingAbout] = useState(false);
  const [aboutImageFile, setAboutImageFile] = useState<File | null>(null);
  const [aboutImagePreview, setAboutImagePreview] = useState<string | null>(null);

  // Forms
  const projectForm = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: { title: '', description: '', image_url: '', live_demo_url: '', repo_url: '', tags: '', status: 'Concept', progress: null }
  });
  const categoryForm = useForm<SkillCategoryFormData>({
    resolver: zodResolver(skillCategorySchema),
    defaultValues: { name: '', icon_image_url: '', sort_order: 0 }
  });
  const skillForm = useForm<SkillFormData>({
    resolver: zodResolver(skillSchema),
    defaultValues: { category_id: '', name: '', icon_image_url: '', description: '' }
  });
   const aboutForm = useForm<AboutContentFormData>({
    resolver: zodResolver(aboutContentSchema),
    defaultValues: {
      id: PRIMARY_ABOUT_CONTENT_ID,
      headline_main: '', headline_code_keyword: '', headline_connector: '', headline_creativity_keyword: '',
      paragraph1: '', paragraph2: '', paragraph3: '',
      image_url: '', image_tagline: ''
    }
  });

  // Watched form values for previews
  const currentProjectImageUrlForPreview = projectForm.watch('image_url');
  const currentCategoryIconUrlForPreview = categoryForm.watch('icon_image_url');
  const currentSkillIconUrlForPreview = skillForm.watch('icon_image_url');
  const currentAboutImageUrlForPreview = aboutForm.watch('image_url');

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const authStatus = localStorage.getItem('isAdminAuthenticated') === 'true';
      setIsAuthenticatedForRender(authStatus);
      if (authStatus) {
        fetchProjects();
        fetchSkillCategories();
        fetchAboutContent();
      }
    }
  }, []);

  // Image Preview Effects
  useEffect(() => { if (projectImageFile) { const reader = new FileReader(); reader.onloadend = () => setProjectImagePreview(reader.result as string); reader.readAsDataURL(projectImageFile); } else if (projectForm.getValues('image_url')) { setProjectImagePreview(projectForm.getValues('image_url'));} else {setProjectImagePreview(null);}}, [projectImageFile, currentProjectImageUrlForPreview, projectForm]);
  useEffect(() => { if (categoryIconFile) { const reader = new FileReader(); reader.onloadend = () => setCategoryIconPreview(reader.result as string); reader.readAsDataURL(categoryIconFile); } else if (categoryForm.getValues('icon_image_url')) {setCategoryIconPreview(categoryForm.getValues('icon_image_url'));} else {setCategoryIconPreview(null);}}, [categoryIconFile, currentCategoryIconUrlForPreview, categoryForm]);
  useEffect(() => { if (skillIconFile) { const reader = new FileReader(); reader.onloadend = () => setSkillIconPreview(reader.result as string); reader.readAsDataURL(skillIconFile); } else if (skillForm.getValues('icon_image_url')) {setSkillIconPreview(skillForm.getValues('icon_image_url'));} else {setSkillIconPreview(null);}}, [skillIconFile, currentSkillIconUrlForPreview, skillForm]);
  useEffect(() => { if (aboutImageFile) { const reader = new FileReader(); reader.onloadend = () => setAboutImagePreview(reader.result as string); reader.readAsDataURL(aboutImageFile); } else if (aboutForm.getValues('image_url')) {setAboutImagePreview(aboutForm.getValues('image_url'));} else {setAboutImagePreview(null);}}, [aboutImageFile, currentAboutImageUrlForPreview, aboutForm]);


  // Form population effects
  useEffect(() => {
    if (currentProject) {
      projectForm.reset({
        id: currentProject.id, title: currentProject.title, description: currentProject.description || '',
        image_url: currentProject.imageUrl || '', live_demo_url: currentProject.liveDemoUrl || '', repo_url: currentProject.repoUrl || '',
        tags: currentProject.tags, // tags is already a string here
        status: currentProject.status || 'Concept',
        progress: currentProject.progress === null || currentProject.progress === undefined ? null : Number(currentProject.progress),
      });
      setProjectImageFile(null);
    } else { projectForm.reset({ title: '', description: '', image_url: '', live_demo_url: '', repo_url: '', tags: '', status: 'Concept', progress: null }); setProjectImageFile(null); setProjectImagePreview(null); }
  }, [currentProject, projectForm]);

  useEffect(() => {
    if (currentCategory) {
      categoryForm.reset({
        id: currentCategory.id, name: currentCategory.name, icon_image_url: currentCategory.iconImageUrl || '',
        sort_order: currentCategory.sort_order === null || currentCategory.sort_order === undefined ? 0 : Number(currentCategory.sort_order),
      });
      setCategoryIconFile(null);
    } else { categoryForm.reset({ name: '', icon_image_url: '', sort_order: 0 }); setCategoryIconFile(null); setCategoryIconPreview(null); }
  }, [currentCategory, categoryForm]);

  useEffect(() => {
    if (currentSkill) {
      skillForm.reset({
        id: currentSkill.id, category_id: currentSkill.categoryId || parentCategoryIdForNewSkill || '', name: currentSkill.name,
        icon_image_url: currentSkill.iconImageUrl || '', description: currentSkill.description || '',
      });
      setSkillIconFile(null);
    } else { skillForm.reset({ category_id: parentCategoryIdForNewSkill || '', name: '', icon_image_url: '', description: ''}); setSkillIconFile(null); setSkillIconPreview(null); }
  }, [currentSkill, parentCategoryIdForNewSkill, skillForm]);

  // Fetch functions
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
        id: p.id,
        title: p.title,
        description: p.description,
        imageUrl: p.image_url,
        liveDemoUrl: p.live_demo_url,
        repoUrl: p.repo_url,
        tags: p.tags,
        status: p.status as ProjectStatus | null,
        progress: p.progress,
        created_at: p.created_at,
      }));
      setProjects(mappedData);
    } else {
      setProjects([]);
    }
    setIsLoadingProjects(false);
  };

  const fetchSkillCategories = async () => {
    setIsLoadingSkills(true);
    const { data, error: fetchError } = await supabase
      .from('skill_categories')
      .select(`
        id,
        name,
        icon_image_url,
        sort_order,
        created_at,
        skills (id, name, icon_image_url, description, category_id)
      `)
      .order('sort_order', { ascending: true })
      .order('name', { foreignTable: 'skills', ascending: true });

    if (fetchError) {
      console.error('Error fetching skill categories:', JSON.stringify(fetchError, null, 2));
      toast({ title: "Error", description: `Could not fetch skills: ${fetchError.message}`, variant: "destructive" });
      setSkillCategories([]);
    } else if (data) {
      const mappedData: MappedSkillCategory[] = data.map(cat => ({
        id: cat.id,
        name: cat.name,
        iconImageUrl: cat.icon_image_url,
        sort_order: cat.sort_order,
        created_at: cat.created_at,
        skills: (cat.skills || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          iconImageUrl: s.icon_image_url,
          description: s.description,
          categoryId: s.category_id,
        })),
      }));
      setSkillCategories(mappedData);
    } else {
      setSkillCategories([]);
    }
    setIsLoadingSkills(false);
  };

  const fetchAboutContent = async () => {
    setIsLoadingAbout(true);
    const { data, error: fetchError } = await supabase
      .from('about_content')
      .select('*')
      .eq('id', PRIMARY_ABOUT_CONTENT_ID)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching about content:', JSON.stringify(fetchError, null, 2));
      toast({ title: "Error", description: `Could not fetch About Me content: ${fetchError.message}`, variant: "destructive" });
    } else if (data) {
      aboutForm.reset({
        id: data.id,
        headline_main: data.headline_main || '',
        headline_code_keyword: data.headline_code_keyword || '',
        headline_connector: data.headline_connector || '',
        headline_creativity_keyword: data.headline_creativity_keyword || '',
        paragraph1: data.paragraph1 || '',
        paragraph2: data.paragraph2 || '',
        paragraph3: data.paragraph3 || '',
        image_url: data.image_url || '',
        image_tagline: data.image_tagline || '',
      });
      setAboutImagePreview(data.image_url || null);
    } else {
       aboutForm.reset({ id: PRIMARY_ABOUT_CONTENT_ID, headline_main: '', headline_code_keyword: '', headline_connector: '', headline_creativity_keyword: '', paragraph1: '', paragraph2: '', paragraph3: '', image_url: '', image_tagline: ''});
       setAboutImagePreview(null);
    }
    setAboutImageFile(null);
    setIsLoadingAbout(false);
  };


  // Auth handlers
  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    console.log('[Admin Login] Attempting login...');
    console.log('[Admin Login] Entered Username:', `"${trimmedUsername}"`);
    const expectedUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME;
    console.log('[Admin Login] Expected Username from env:', `"${expectedUsername}"`);
    const expectedPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    // console.log('[Admin Login] Expected Password from env (masked for security):', expectedPassword ? "****" : "MISSING");

    const usernameMatch = trimmedUsername === expectedUsername;
    const passwordMatch = trimmedPassword === expectedPassword;

    console.log('[Admin Login] Username match status:', usernameMatch);
    console.log('[Admin Login] Password match status (not logging actual passwords):', passwordMatch);


    if (usernameMatch && passwordMatch) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('isAdminAuthenticated', 'true');
        window.dispatchEvent(new CustomEvent('authChange'));
      }
      setIsAuthenticatedForRender(true);
      fetchProjects();
      fetchSkillCategories();
      fetchAboutContent();
      console.log('[Admin Login] Login successful.');
    } else {
      setError("Invalid username or password.");
      setIsAuthenticatedForRender(false);
      console.log('[Admin Login] Login failed.');
    }
  };
  const handleLogout = () => { if (typeof window !== 'undefined') localStorage.removeItem('isAdminAuthenticated'); window.dispatchEvent(new CustomEvent('authChange')); setIsAuthenticatedForRender(false); setUsername(''); setPassword(''); setProjects([]); setSkillCategories([]); aboutForm.reset(); setAboutImagePreview(null); };


  // File change handlers
  const handleProjectImageFileChange = (event: ChangeEvent<HTMLInputElement>) => { if (event.target.files?.[0]) { setProjectImageFile(event.target.files[0]); projectForm.setValue('image_url', ''); } else { setProjectImageFile(null); }};
  const handleCategoryIconFileChange = (event: ChangeEvent<HTMLInputElement>) => { if (event.target.files?.[0]) { setCategoryIconFile(event.target.files[0]); categoryForm.setValue('icon_image_url', ''); } else { setCategoryIconFile(null); }};
  const handleSkillIconFileChange = (event: ChangeEvent<HTMLInputElement>) => { if (event.target.files?.[0]) { setSkillIconFile(event.target.files[0]); skillForm.setValue('icon_image_url', ''); } else { setSkillIconFile(null); }};
  const handleAboutImageFileChange = (event: ChangeEvent<HTMLInputElement>) => { if (event.target.files?.[0]) { setAboutImageFile(event.target.files[0]); aboutForm.setValue('image_url', ''); } else { setAboutImageFile(null); }};


  // Submit handlers
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
      ...formData,
      image_url: imageUrlToSave || null,
      progress: formData.progress === undefined || formData.progress === null ? null : Number(formData.progress),
      live_demo_url: formData.live_demo_url || null,
      repo_url: formData.repo_url || null,
    };

    if (formData.id) {
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
    } else {
      const { id, ...dataToInsert } = projectDataToSave;
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

  const onCategorySubmit: SubmitHandler<SkillCategoryFormData> = async (formData) => {
    let iconUrlToSave = formData.icon_image_url;

    if (categoryIconFile) {
      const fileExt = categoryIconFile.name.split('.').pop();
      const fileName = `category_${Date.now()}.${fileExt}`;
      const filePath = `categories/${fileName}`;
      toast({ title: "Uploading Category Icon", description: "Please wait...", variant: "default" });
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('category-icons')
        .upload(filePath, categoryIconFile, { cacheControl: '3600', upsert: !!formData.id });

      if (uploadError) {
        console.error("Error uploading category icon:", JSON.stringify(uploadError, null, 2));
        toast({ title: "Upload Error", description: `Failed to upload category icon: ${uploadError.message}`, variant: "destructive" });
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('category-icons').getPublicUrl(filePath);
      iconUrlToSave = publicUrlData?.publicUrl || null;
    }

    const categoryDataToSave = {
      ...formData,
      icon_image_url: iconUrlToSave || null,
      sort_order: formData.sort_order === undefined || formData.sort_order === null ? 0 : Number(formData.sort_order),
    };

    if (formData.id) {
      const { error: updateError } = await supabase
        .from('skill_categories')
        .update(categoryDataToSave)
        .eq('id', formData.id);
      if (updateError) { toast({ title: "Error updating category", description: updateError.message, variant: "destructive" }); }
      else { toast({ title: "Success", description: "Category updated." }); }
    } else {
      const { id, ...dataToInsert } = categoryDataToSave;
      const { error: insertError } = await supabase
        .from('skill_categories')
        .insert(dataToInsert as any);
      if (insertError) { toast({ title: "Error adding category", description: insertError.message, variant: "destructive" }); }
      else { toast({ title: "Success", description: "Category added." }); }
    }
    fetchSkillCategories();
    setIsCategoryModalOpen(false);
    setCategoryIconFile(null);
    categoryForm.reset();
    router.refresh();
  };

  const onSkillSubmit: SubmitHandler<SkillFormData> = async (formData) => {
    let iconUrlToSave = formData.icon_image_url;

    if (skillIconFile) {
      const fileExt = skillIconFile.name.split('.').pop();
      const fileName = `skill_${Date.now()}.${fileExt}`;
      const filePath = `skills/${fileName}`;
      toast({ title: "Uploading Skill Icon", description: "Please wait...", variant: "default" });
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('skill-icons')
        .upload(filePath, skillIconFile, { cacheControl: '3600', upsert: !!formData.id });

      if (uploadError) {
        console.error("Error uploading skill icon:", JSON.stringify(uploadError, null, 2));
        toast({ title: "Upload Error", description: `Failed to upload skill icon: ${uploadError.message}`, variant: "destructive" });
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('skill-icons').getPublicUrl(filePath);
      iconUrlToSave = publicUrlData?.publicUrl || null;
    }
    
    const skillDataToSave = {
      ...formData,
      icon_image_url: iconUrlToSave || null,
    };

    if (formData.id) {
      const { error: updateError } = await supabase
        .from('skills')
        .update(skillDataToSave)
        .eq('id', formData.id);
      if (updateError) { toast({ title: "Error updating skill", description: updateError.message, variant: "destructive" }); }
      else { toast({ title: "Success", description: "Skill updated." }); }
    } else {
      const { id, ...dataToInsert } = skillDataToSave;
      const { error: insertError } = await supabase
        .from('skills')
        .insert(dataToInsert as any);
      if (insertError) { toast({ title: "Error adding skill", description: insertError.message, variant: "destructive" }); }
      else { toast({ title: "Success", description: "Skill added." }); }
    }
    fetchSkillCategories();
    setIsSkillModalOpen(false);
    setSkillIconFile(null);
    skillForm.reset();
    router.refresh();
  };

  const onAboutSubmit: SubmitHandler<AboutContentFormData> = async (formData) => {
    let imageUrlToSave = formData.image_url;

    if (aboutImageFile) {
      const fileExt = aboutImageFile.name.split('.').pop();
      const fileName = `about_me_image.${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`; // Store at root of 'about-images' bucket
      toast({ title: "Uploading About Me Image", description: "Please wait...", variant: "default" });
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('about-images')
        .upload(filePath, aboutImageFile, { cacheControl: '3600', upsert: false }); 

      if (uploadError) {
        console.error("Error uploading About Me image:", JSON.stringify(uploadError, null, 2));
        toast({ title: "Upload Error", description: `Failed to upload About Me image: ${uploadError.message}`, variant: "destructive" });
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('about-images').getPublicUrl(filePath);
      if (!publicUrlData?.publicUrl) {
        toast({ title: "Error", description: "Failed to get public URL for uploaded About Me image.", variant: "destructive" });
        return;
      }
      imageUrlToSave = publicUrlData.publicUrl;
    }

    const dataForUpsert = {
      ...formData,
      id: PRIMARY_ABOUT_CONTENT_ID, 
      image_url: imageUrlToSave || null,
      updated_at: new Date().toISOString(),
    };
    
    const { error: upsertError } = await supabase
      .from('about_content')
      .upsert(dataForUpsert, { onConflict: 'id' });

    if (upsertError) {
      console.error("Error saving About Me content:", JSON.stringify(upsertError, null, 2));
      toast({ title: "Error", description: `Failed to save About Me content: ${upsertError.message}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "About Me content saved successfully." });
      fetchAboutContent(); 
      router.refresh(); 
    }
  };

  // Delete handlers
  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    console.log("[AdminDashboard] Attempting to delete project ID:", projectToDelete.id);
    
    if (projectToDelete.imageUrl) {
        const imagePath = projectToDelete.imageUrl.substring(projectToDelete.imageUrl.indexOf('/project-images/') + '/project-images/'.length);
        if (imagePath && !imagePath.startsWith('http')) {
            console.log("[AdminDashboard] Attempting to delete image from storage:", imagePath);
            const { error: storageError } = await supabase.storage.from('project-images').remove([imagePath]);
            if (storageError) {
                console.warn("[AdminDashboard] Error deleting project image from storage, proceeding with DB delete:", JSON.stringify(storageError, null, 2));
            }
        }
    }
    
    console.log("[AdminDashboard] Proceeding with Supabase DB delete call for project...");
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectToDelete.id);

    if (deleteError) {
      console.error("[AdminDashboard] Error deleting project from DB (raw Supabase error object):", JSON.stringify(deleteError, null, 2));
      toast({ title: "Error", description: `Failed to delete project: ${deleteError.message || 'An unexpected error occurred.'}`, variant: "destructive" });
    } else {
      console.log("[AdminDashboard] Project deleted successfully from DB.");
      toast({ title: "Success", description: "Project deleted successfully." });
      fetchProjects();
      router.refresh();
    }
    setShowProjectDeleteConfirm(false);
    setProjectToDelete(null);
  };

  const performDeleteCategory = async (categoryId: string) => {
    const category = skillCategories.find(cat => cat.id === categoryId);
    if (category && category.skills && category.skills.length > 0) {
      toast({ title: "Action Denied", description: "Cannot delete category: It still contains skills. Please delete its skills first.", variant: "destructive" });
      return;
    }
    if (category?.iconImageUrl) {
      const imagePath = category.iconImageUrl.substring(category.iconImageUrl.indexOf('/category-icons/') + '/category-icons/'.length);
      if(imagePath && !imagePath.startsWith('http')) {
          const {error: storageError} = await supabase.storage.from('category-icons').remove([imagePath]);
          if (storageError) console.warn("[AdminDashboard] Error deleting category icon from storage:", JSON.stringify(storageError, null, 2));
      }
    }

    const { error } = await supabase.from('skill_categories').delete().eq('id', categoryId);
    if (error) { console.error("[AdminDashboard] Error deleting category from DB:", JSON.stringify(error, null, 2)); toast({ title: "Error deleting category", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Success", description: "Category deleted." }); fetchSkillCategories(); router.refresh(); }
    setShowCategoryDeleteConfirm(false);
    setCategoryToDelete(null);
  };

  const performDeleteSkill = async (skillId: string) => {
    const skillToDeleteData = skillCategories.flatMap(cat => cat.skills).find(s => s.id === skillId);
     if (skillToDeleteData?.iconImageUrl) {
      const imagePath = skillToDeleteData.iconImageUrl.substring(skillToDeleteData.iconImageUrl.indexOf('/skill-icons/') + '/skill-icons/'.length);
       if(imagePath && !imagePath.startsWith('http')) {
          const {error: storageError} = await supabase.storage.from('skill-icons').remove([imagePath]);
          if (storageError) console.warn("[AdminDashboard] Error deleting skill icon from storage:", JSON.stringify(storageError, null, 2));
      }
    }

    const { error } = await supabase.from('skills').delete().eq('id', skillId);
    if (error) { console.error("[AdminDashboard] Error deleting skill from DB:", JSON.stringify(error, null, 2)); toast({ title: "Error deleting skill", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Success", description: "Skill deleted." }); fetchSkillCategories(); router.refresh(); }
    setShowSkillDeleteConfirm(false);
    setSkillToDelete(null);
  };


  // Modal triggers / openers
  const triggerDeleteConfirmation = (project: MappedProject) => { setProjectToDelete(project); setShowProjectDeleteConfirm(true);};
  const handleOpenProjectModal = (project?: MappedProject) => { setCurrentProject(project ? {...project, tags: (project.tags || []).join(', ')} : null); setIsProjectModalOpen(true); };
  const handleOpenCategoryModal = (category?: MappedSkillCategory) => { setCurrentCategory(category ? { ...category, icon_image_url: category.iconImageUrl || '' } : null); setIsCategoryModalOpen(true); };
  const triggerCategoryDeleteConfirmation = (category: MappedSkillCategory) => { setCategoryToDelete(category); setShowCategoryDeleteConfirm(true); };
  const handleOpenSkillModal = (category_id: string, skill?: SkillType) => { setParentCategoryIdForNewSkill(category_id); setCurrentSkill(skill ? { ...skill, icon_image_url: skill.iconImageUrl || '', category_id: skill.categoryId || category_id } : null); skillForm.setValue('category_id', category_id); setIsSkillModalOpen(true); };
  const triggerSkillDeleteConfirmation = (skill: SkillType) => { setSkillToDelete(skill); setShowSkillDeleteConfirm(true); };


  // JSX for loading and login states
  if (!isMounted) { return (<SectionWrapper><div className="flex justify-center items-center min-h-screen"><p className="text-muted-foreground">Loading dashboard...</p></div></SectionWrapper>); }
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
                <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="your_username" required />
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
             <Link href="/" className={cn(buttonVariants({ variant: "link" }), "text-muted-foreground hover:text-primary flex items-center")}>
                 <Home className="mr-2 h-4 w-4" />Back to Portfolio
            </Link>
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
          <Link href="/">
            <span>
              <Home className="mr-2 h-4 w-4"/>Back to Portfolio
            </span>
          </Link>
        </Button>
        <Button variant="outline" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /> Logout</Button>
      </div>

      {/* Projects Management Section */}
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">Manage Projects
            <Dialog open={isProjectModalOpen} onOpenChange={(isOpen) => { setIsProjectModalOpen(isOpen); if (!isOpen) { setCurrentProject(null); setProjectImageFile(null); projectForm.reset(); }}}>
              <DialogTrigger asChild><Button onClick={() => handleOpenProjectModal()}><PlusCircle className="mr-2 h-4 w-4" /> Add Project</Button></DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader><DialogTitle>{currentProject?.id ? 'Edit Project' : 'Add New Project'}</DialogTitle></DialogHeader>
                <form onSubmit={projectForm.handleSubmit(onProjectSubmit)} className="grid gap-4 py-4 max-h-[80vh] overflow-y-auto p-2 scrollbar-hide">
                  <div><Label htmlFor="title">Title</Label><Input id="title" {...projectForm.register("title")} />{projectForm.formState.errors.title && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.title.message}</p>}</div>
                  <div><Label htmlFor="description">Description</Label><Textarea id="description" {...projectForm.register("description")} />{projectForm.formState.errors.description && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.description.message}</p>}</div>
                  <div className="space-y-2">
                    <Label htmlFor="project_image_file">Project Image File</Label>
                    <div className="flex items-center gap-3"><Input id="project_image_file" type="file" accept="image/*" onChange={handleProjectImageFileChange} className="flex-grow" /><UploadCloud className="h-6 w-6 text-muted-foreground"/></div>
                    {(projectImagePreview || currentProjectImageUrlForPreview) && (<div className="mt-2 p-2 border rounded-md bg-muted aspect-video relative w-full max-w-xs mx-auto"><Image src={projectImagePreview || currentProjectImageUrlForPreview || "https://placehold.co/600x400.png"} alt="Image preview" fill objectFit="contain" className="rounded"/></div>)}
                    <div><Label htmlFor="image_url_project" className="text-xs text-muted-foreground">Or enter Image URL (upload will override)</Label><Input id="image_url_project" {...projectForm.register("image_url")} placeholder="https://example.com/image.png" />{projectForm.formState.errors.image_url && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.image_url.message}</p>}</div>
                  </div>
                  <div><Label htmlFor="live_demo_url">Live Demo URL</Label><Input id="live_demo_url" {...projectForm.register("live_demo_url")} placeholder="https://example.com/demo" />{projectForm.formState.errors.live_demo_url && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.live_demo_url.message}</p>}</div>
                  <div><Label htmlFor="repo_url">Repository URL</Label><Input id="repo_url" {...projectForm.register("repo_url")} placeholder="https://github.com/user/repo" />{projectForm.formState.errors.repo_url && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.repo_url.message}</p>}</div>
                  <div><Label htmlFor="tags">Tags (comma-separated)</Label><Input id="tags" {...projectForm.register("tags")} placeholder="React, Next.js, Supabase" /></div>
                  <div><Label htmlFor="status">Status</Label><select id="status" {...projectForm.register("status")} className="w-full p-2 border rounded-md bg-background text-sm focus:ring-ring focus:border-input">{(['Concept', 'Prototype', 'In Progress', 'Completed', 'Deployed', 'Archived'] as ProjectStatus[]).map(s => (<option key={s} value={s}>{s}</option>))} </select></div>
                  <div><Label htmlFor="progress">Progress (0-100, for 'In Progress')</Label><Input id="progress" type="number" {...projectForm.register("progress", {setValueAs: (v) => (v === '' || v === null || v === undefined ? null : Number(v))})} />{projectForm.formState.errors.progress && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.progress.message}</p>}</div>
                  <DialogFooter><DialogClose asChild><Button type="button" variant="outline" onClick={() => { setProjectImageFile(null); projectForm.reset();}}>Cancel</Button></DialogClose><Button type="submit">{currentProject?.id ? 'Save Changes' : 'Add Project'}</Button></DialogFooter>
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
                   {project.imageUrl && ( <div className="w-24 h-16 relative mr-4 mb-2 sm:mb-0 flex-shrink-0 rounded overflow-hidden border dark:bg-secondary"> <Image src={project.imageUrl} alt={project.title || "Project image"} layout="fill" objectFit="cover" /> </div> )}
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
        <AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground">
            <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive-foreground">Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-destructive-foreground/90">This action cannot be undone. This will permanently delete the project "{projectToDelete?.title}".</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => { setShowProjectDeleteConfirm(false); setProjectToDelete(null);}} className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground", "hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteProject} className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive", "hover:bg-destructive-foreground/90")}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

     {/* Skills Management Section */}
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">Manage Skills
            <Dialog open={isCategoryModalOpen} onOpenChange={(isOpen) => { setIsCategoryModalOpen(isOpen); if (!isOpen) { setCurrentCategory(null); setCategoryIconFile(null); categoryForm.reset(); }}}>
              <DialogTrigger asChild><Button onClick={() => handleOpenCategoryModal()}><PlusCircle className="mr-2 h-4 w-4" /> Add Category</Button></DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader><DialogTitle>{currentCategory?.id ? 'Edit Skill Category' : 'Add New Skill Category'}</DialogTitle></DialogHeader>
                <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="grid gap-4 py-4">
                  <div><Label htmlFor="categoryName">Name</Label><Input id="categoryName" {...categoryForm.register("name")} />{categoryForm.formState.errors.name && <p className="text-destructive text-sm mt-1">{categoryForm.formState.errors.name.message}</p>}</div>
                  <div className="space-y-2">
                    <Label htmlFor="category_icon_file">Category Icon File</Label>
                    <div className="flex items-center gap-3"><Input id="category_icon_file" type="file" accept="image/*" onChange={handleCategoryIconFileChange} className="flex-grow" /><UploadCloud className="h-6 w-6 text-muted-foreground"/></div>
                    {(categoryIconPreview || currentCategoryIconUrlForPreview) && (<div className="mt-2 p-2 border rounded-md bg-muted aspect-square relative w-24 h-24 mx-auto"><Image src={categoryIconPreview || currentCategoryIconUrlForPreview || "https://placehold.co/100x100.png"} alt="Icon preview" fill objectFit="contain" className="rounded"/></div>)}
                     <div>
                        <Label htmlFor="icon_image_url_category" className="text-xs text-muted-foreground">
                          Or enter Icon Image URL (upload will override).
                        </Label>
                        <Input id="icon_image_url_category" {...categoryForm.register("icon_image_url")} placeholder="https://example.com/icon.png"/>
                        {categoryForm.formState.errors.icon_image_url && <p className="text-destructive text-sm mt-1">{categoryForm.formState.errors.icon_image_url.message}</p>}
                    </div>
                  </div>
                  <div><Label htmlFor="sortOrder">Sort Order</Label><Input id="sortOrder" type="number" {...categoryForm.register("sort_order")} /></div>
                  <DialogFooter><DialogClose asChild><Button type="button" variant="outline" onClick={() => { setCategoryIconFile(null); categoryForm.reset();}}>Cancel</Button></DialogClose><Button type="submit">{currentCategory?.id ? 'Save Changes' : 'Add Category'}</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSkills ? <p className="text-center text-muted-foreground">Loading skills & categories...</p> : skillCategories.length === 0 ? (<p className="text-center text-muted-foreground py-8">No skill categories found. Add one to get started.</p>) : (
            <Accordion type="single" collapsible className="w-full">
              {skillCategories.map((category) => (
                <AccordionItem value={category.id} key={category.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 flex-grow">
                      {category.iconImageUrl ? <Image src={category.iconImageUrl} alt={category.name} width={20} height={20} className="rounded-sm" /> : <DefaultCategoryIcon className="h-5 w-5 text-primary"/>}
                      <span className="font-medium text-lg">{category.name}</span>
                      <Badge variant="outline">{category.skills?.length || 0} skills</Badge>
                    </div>
                    <div className="flex space-x-2 shrink-0 ml-auto pl-4">
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenCategoryModal(category);}}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); triggerCategoryDeleteConfirmation(category);}}><Trash2 className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" onClick={(e) => { e.stopPropagation(); handleOpenSkillModal(category.id);}}><PlusCircle className="mr-1.5 h-3.5 w-3.5"/> Add Skill</Button>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="bg-muted/20 p-4 rounded-b-md">
                    {category.skills && category.skills.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {category.skills.map(skill => (
                          <Card key={skill.id} className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {skill.iconImageUrl ? <Image src={skill.iconImageUrl} alt={skill.name} width={16} height={16} className="rounded-sm" /> : <DefaultSkillIcon className="h-4 w-4 text-muted-foreground"/>}
                                <span className="text-sm font-medium">{skill.name}</span>
                              </div>
                              <div className="flex space-x-1.5">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenSkillModal(category.id, skill)}><Edit className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => triggerSkillDeleteConfirmation(skill)}><Trash2 className="h-3.5 w-3.5" /></Button>
                              </div>
                            </div>
                            {skill.description && <p className="text-xs text-muted-foreground mt-1.5 pl-6">{skill.description}</p>}
                          </Card>
                        ))}
                      </div>
                    ) : (<p className="text-sm text-muted-foreground text-center py-4">No skills in this category yet.</p>)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* About Me Content Management Section */}
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Manage About Content
            <AboutMeIcon className="h-6 w-6 text-primary" />
          </CardTitle>
          <CardDescription>Update the text, image, and tagline for your "About Me" section.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAbout ? (
            <p className="text-center text-muted-foreground">Loading About Me content...</p>
          ) : (
            <form onSubmit={aboutForm.handleSubmit(onAboutSubmit)} className="grid gap-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label htmlFor="headline_main">Headline Main</Label><Input id="headline_main" {...aboutForm.register("headline_main")} placeholder="e.g., Milan: Weaving "/>{aboutForm.formState.errors.headline_main && <p className="text-destructive text-sm mt-1">{aboutForm.formState.errors.headline_main.message}</p>}</div>
                <div><Label htmlFor="headline_code_keyword">Headline Code Keyword</Label><Input id="headline_code_keyword" {...aboutForm.register("headline_code_keyword")} placeholder="e.g., Code"/>{aboutForm.formState.errors.headline_code_keyword && <p className="text-destructive text-sm mt-1">{aboutForm.formState.errors.headline_code_keyword.message}</p>}</div>
                <div><Label htmlFor="headline_connector">Headline Connector</Label><Input id="headline_connector" {...aboutForm.register("headline_connector")} placeholder="e.g.,  with "/>{aboutForm.formState.errors.headline_connector && <p className="text-destructive text-sm mt-1">{aboutForm.formState.errors.headline_connector.message}</p>}</div>
                <div><Label htmlFor="headline_creativity_keyword">Headline Creativity Keyword</Label><Input id="headline_creativity_keyword" {...aboutForm.register("headline_creativity_keyword")} placeholder="e.g., Creativity"/>{aboutForm.formState.errors.headline_creativity_keyword && <p className="text-destructive text-sm mt-1">{aboutForm.formState.errors.headline_creativity_keyword.message}</p>}</div>
              </div>

              <div><Label htmlFor="paragraph1">Paragraph 1</Label><Textarea id="paragraph1" {...aboutForm.register("paragraph1")} rows={3} />{aboutForm.formState.errors.paragraph1 && <p className="text-destructive text-sm mt-1">{aboutForm.formState.errors.paragraph1.message}</p>}</div>
              <div><Label htmlFor="paragraph2">Paragraph 2</Label><Textarea id="paragraph2" {...aboutForm.register("paragraph2")} rows={3} />{aboutForm.formState.errors.paragraph2 && <p className="text-destructive text-sm mt-1">{aboutForm.formState.errors.paragraph2.message}</p>}</div>
              <div><Label htmlFor="paragraph3">Paragraph 3</Label><Textarea id="paragraph3" {...aboutForm.register("paragraph3")} rows={3} />{aboutForm.formState.errors.paragraph3 && <p className="text-destructive text-sm mt-1">{aboutForm.formState.errors.paragraph3.message}</p>}</div>
              
              <div className="space-y-2">
                <Label htmlFor="about_image_file">About Me Image File</Label>
                <div className="flex items-center gap-3">
                  <Input id="about_image_file" type="file" accept="image/*" onChange={handleAboutImageFileChange} className="flex-grow" />
                  <UploadCloud className="h-6 w-6 text-muted-foreground"/>
                </div>
                {(aboutImagePreview || currentAboutImageUrlForPreview) && (
                  <div className="mt-2 p-2 border rounded-md bg-muted aspect-video relative w-full max-w-sm mx-auto">
                    <Image src={aboutImagePreview || currentAboutImageUrlForPreview || "https://placehold.co/600x400.png"} alt="About Me image preview" fill objectFit="contain" className="rounded"/>
                  </div>
                )}
                <div>
                  <Label htmlFor="image_url_about" className="text-xs text-muted-foreground">Or enter Image URL (upload will override)</Label>
                  <Input id="image_url_about" {...aboutForm.register("image_url")} placeholder="https://example.com/about-image.png" />
                  {aboutForm.formState.errors.image_url && <p className="text-destructive text-sm mt-1">{aboutForm.formState.errors.image_url.message}</p>}
                </div>
              </div>

              <div><Label htmlFor="image_tagline">Image Tagline</Label><Input id="image_tagline" {...aboutForm.register("image_tagline")} placeholder="e.g., Fuelled by coffee & code."/>{aboutForm.formState.errors.image_tagline && <p className="text-destructive text-sm mt-1">{aboutForm.formState.errors.image_tagline.message}</p>}</div>

              <Button type="submit" className="w-full sm:w-auto justify-self-start">Save About Content</Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Modals for Skills and Categories */}
      <Dialog open={isSkillModalOpen} onOpenChange={(isOpen) => { setIsSkillModalOpen(isOpen); if (!isOpen) { setCurrentSkill(null); setParentCategoryIdForNewSkill(null); setSkillIconFile(null); skillForm.reset(); }}}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>{currentSkill?.id ? 'Edit Skill' : 'Add New Skill'}</DialogTitle></DialogHeader>
          <form onSubmit={skillForm.handleSubmit(onSkillSubmit)} className="grid gap-4 py-4">
            <Input type="hidden" {...skillForm.register("category_id")} />
            <div><Label htmlFor="skillName">Name</Label><Input id="skillName" {...skillForm.register("name")} />{skillForm.formState.errors.name && <p className="text-destructive text-sm mt-1">{skillForm.formState.errors.name.message}</p>}</div>
            <div className="space-y-2">
              <Label htmlFor="skill_icon_file">Skill Icon File</Label>
              <div className="flex items-center gap-3"><Input id="skill_icon_file" type="file" accept="image/*" onChange={handleSkillIconFileChange} className="flex-grow" /><UploadCloud className="h-6 w-6 text-muted-foreground"/></div>
              {(skillIconPreview || currentSkillIconUrlForPreview) && (<div className="mt-2 p-2 border rounded-md bg-muted aspect-square relative w-24 h-24 mx-auto"><Image src={skillIconPreview || currentSkillIconUrlForPreview || "https://placehold.co/100x100.png"} alt="Icon preview" fill objectFit="contain" className="rounded"/></div>)}
               <div>
                  <Label htmlFor="icon_image_url_skill" className="text-xs text-muted-foreground">
                    Or enter Icon Image URL (upload will override).
                  </Label>
                  <Input id="icon_image_url_skill" {...skillForm.register("icon_image_url")} placeholder="https://example.com/icon.png"/>
                  {skillForm.formState.errors.icon_image_url && <p className="text-destructive text-sm mt-1">{skillForm.formState.errors.icon_image_url.message}</p>}
              </div>
            </div>
            <div><Label htmlFor="skillDescription">Description (Optional)</Label><Textarea id="skillDescription" {...skillForm.register("description")} /></div>
            <DialogFooter><DialogClose asChild><Button type="button" variant="outline" onClick={() => { setSkillIconFile(null); skillForm.reset();}}>Cancel</Button></DialogClose><Button type="submit">{currentSkill?.id ? 'Save Changes' : 'Add Skill'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCategoryDeleteConfirm} onOpenChange={setShowCategoryDeleteConfirm}>
         <AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground">
            <AlertDialogHeader><AlertDialogTitle className="text-destructive-foreground">Delete Category: {categoryToDelete?.name}?</AlertDialogTitle><AlertDialogDescription className="text-destructive-foreground/90">This will delete the category. This action cannot be undone. Ensure all skills within are moved or deleted first if necessary.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => { setShowCategoryDeleteConfirm(false); setCategoryToDelete(null);}} className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground", "hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => categoryToDelete && performDeleteCategory(categoryToDelete.id)} className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive", "hover:bg-destructive-foreground/90")}>Delete Category</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSkillDeleteConfirm} onOpenChange={setShowSkillDeleteConfirm}>
        <AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground">
            <AlertDialogHeader><AlertDialogTitle className="text-destructive-foreground">Delete Skill: {skillToDelete?.name}?</AlertDialogTitle><AlertDialogDescription className="text-destructive-foreground/90">This action cannot be undone. This will permanently delete the skill.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => { setShowSkillDeleteConfirm(false); setSkillToDelete(null);}} className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground", "hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => skillToDelete && performDeleteSkill(skillToDelete.id)} className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive", "hover:bg-destructive-foreground/90")}>Delete Skill</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </SectionWrapper>
  );
}
