
"use client";

import React, { useEffect, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, PlusCircle, Edit, Trash2, Package as DefaultCategoryIcon, Cpu as DefaultSkillIcon, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import type { SkillCategory, Skill as SkillType } from '@/types/supabase';
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
} from "@/components/ui/accordion";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
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

interface MappedSkillCategory extends SkillCategory {
  skills: SkillType[];
}

export default function SkillsManager() {
  const router = useRouter();
  const { toast } = useToast();

  const [skillCategories, setSkillCategories] = useState<MappedSkillCategory[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<MappedSkillCategory | null>(null);
  const [showCategoryDeleteConfirm, setShowCategoryDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<MappedSkillCategory | null>(null);
  const [categoryIconFile, setCategoryIconFile] = useState<File | null>(null);
  const [categoryIconPreview, setCategoryIconPreview] = useState<string | null>(null);

  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [currentSkill, setCurrentSkill] = useState<SkillType | null>(null);
  const [parentCategoryIdForNewSkill, setParentCategoryIdForNewSkill] = useState<string | null>(null);
  const [showSkillDeleteConfirm, setShowSkillDeleteConfirm] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<SkillType | null>(null);
  const [skillIconFile, setSkillIconFile] = useState<File | null>(null);
  const [skillIconPreview, setSkillIconPreview] = useState<string | null>(null);

  const categoryForm = useForm<SkillCategoryFormData>({
    resolver: zodResolver(skillCategorySchema),
    defaultValues: { name: '', icon_image_url: '', sort_order: 0 }
  });
  const skillForm = useForm<SkillFormData>({
    resolver: zodResolver(skillSchema),
    defaultValues: { category_id: '', name: '', icon_image_url: '', description: '' }
  });

  const currentCategoryIconUrlForPreview = categoryForm.watch('icon_image_url');
  const currentSkillIconUrlForPreview = skillForm.watch('icon_image_url');

  useEffect(() => {
    fetchSkillCategories();
  }, []);

  useEffect(() => { if (categoryIconFile) { const reader = new FileReader(); reader.onloadend = () => setCategoryIconPreview(reader.result as string); reader.readAsDataURL(categoryIconFile); } else if (currentCategory?.iconImageUrl) { setCategoryIconPreview(currentCategory.iconImageUrl); } else if (categoryForm.getValues('icon_image_url')) {setCategoryIconPreview(categoryForm.getValues('icon_image_url'));} else {setCategoryIconPreview(null);}}, [categoryIconFile, currentCategory, currentCategoryIconUrlForPreview, categoryForm]);
  useEffect(() => { if (skillIconFile) { const reader = new FileReader(); reader.onloadend = () => setSkillIconPreview(reader.result as string); reader.readAsDataURL(skillIconFile); } else if (currentSkill?.iconImageUrl) {setSkillIconPreview(currentSkill.iconImageUrl);} else if (skillForm.getValues('icon_image_url')) {setSkillIconPreview(skillForm.getValues('icon_image_url'));} else {setSkillIconPreview(null);}}, [skillIconFile, currentSkill, currentSkillIconUrlForPreview, skillForm]);

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
        // created_at: cat.created_at, // not used in UI
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

  const handleCategoryIconFileChange = (event: ChangeEvent<HTMLInputElement>) => { if (event.target.files?.[0]) { setCategoryIconFile(event.target.files[0]); categoryForm.setValue('icon_image_url', ''); } else { setCategoryIconFile(null); }};
  const handleSkillIconFileChange = (event: ChangeEvent<HTMLInputElement>) => { if (event.target.files?.[0]) { setSkillIconFile(event.target.files[0]); skillForm.setValue('icon_image_url', ''); } else { setSkillIconFile(null); }};

  const onCategorySubmit: SubmitHandler<SkillCategoryFormData> = async (formData) => {
    let iconUrlToSave = formData.icon_image_url;

    if (categoryIconFile) {
      const fileExt = categoryIconFile.name.split('.').pop();
      const fileName = `category_${Date.now()}.${fileExt}`;
      const filePath = `category-icons/${fileName}`;
      toast({ title: "Uploading Category Icon", description: "Please wait..." });
      const { error: uploadError } = await supabase.storage
        .from('category-icons')
        .upload(filePath, categoryIconFile, { cacheControl: '3600', upsert: !!formData.id });

      if (uploadError) {
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
      const { error: updateError } = await supabase.from('skill_categories').update(categoryDataToSave).eq('id', formData.id);
      if (updateError) { toast({ title: "Error updating category", description: updateError.message, variant: "destructive" }); }
      else { toast({ title: "Success", description: "Category updated." }); }
    } else {
      const { id, ...dataToInsert } = categoryDataToSave;
      const { error: insertError } = await supabase.from('skill_categories').insert(dataToInsert as any);
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
      const filePath = `skill-icons/${fileName}`;
      toast({ title: "Uploading Skill Icon", description: "Please wait..." });
      const { error: uploadError } = await supabase.storage
        .from('skill-icons')
        .upload(filePath, skillIconFile, { cacheControl: '3600', upsert: !!formData.id });

      if (uploadError) {
        toast({ title: "Upload Error", description: `Failed to upload skill icon: ${uploadError.message}`, variant: "destructive" });
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('skill-icons').getPublicUrl(filePath);
      iconUrlToSave = publicUrlData?.publicUrl || null;
    }
    
    const skillDataToSave = { ...formData, icon_image_url: iconUrlToSave || null };

    if (formData.id) {
      const { error: updateError } = await supabase.from('skills').update(skillDataToSave).eq('id', formData.id);
      if (updateError) { toast({ title: "Error updating skill", description: updateError.message, variant: "destructive" }); }
      else { toast({ title: "Success", description: "Skill updated." }); }
    } else {
      const { id, ...dataToInsert } = skillDataToSave;
      const { error: insertError } = await supabase.from('skills').insert(dataToInsert as any);
      if (insertError) { toast({ title: "Error adding skill", description: insertError.message, variant: "destructive" }); }
      else { toast({ title: "Success", description: "Skill added." }); }
    }
    fetchSkillCategories(); // Refetch all categories to update the nested skills
    setIsSkillModalOpen(false);
    setSkillIconFile(null);
    skillForm.reset();
    router.refresh();
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
          if (storageError) console.warn("[SkillsManager] Error deleting category icon from storage:", JSON.stringify(storageError, null, 2));
      }
    }

    const { error } = await supabase.from('skill_categories').delete().eq('id', categoryId);
    if (error) { console.error("[SkillsManager] Error deleting category from DB:", JSON.stringify(error, null, 2)); toast({ title: "Error deleting category", description: error.message, variant: "destructive" }); }
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
          if (storageError) console.warn("[SkillsManager] Error deleting skill icon from storage:", JSON.stringify(storageError, null, 2));
      }
    }

    const { error } = await supabase.from('skills').delete().eq('id', skillId);
    if (error) { console.error("[SkillsManager] Error deleting skill from DB:", JSON.stringify(error, null, 2)); toast({ title: "Error deleting skill", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Success", description: "Skill deleted." }); fetchSkillCategories(); router.refresh(); } // Refetch all categories
    setShowSkillDeleteConfirm(false);
    setSkillToDelete(null);
  };

  const handleOpenCategoryModal = (category?: MappedSkillCategory) => { setCurrentCategory(category || null); setIsCategoryModalOpen(true); };
  const triggerCategoryDeleteConfirmation = (category: MappedSkillCategory) => { setCategoryToDelete(category); setShowCategoryDeleteConfirm(true); };
  const handleOpenSkillModal = (category_id: string, skill?: SkillType) => { setParentCategoryIdForNewSkill(category_id); setCurrentSkill(skill ? { ...skill, categoryId: skill.categoryId || category_id } : null); skillForm.setValue('category_id', category_id); setIsSkillModalOpen(true); };
  const triggerSkillDeleteConfirmation = (skill: SkillType) => { setSkillToDelete(skill); setShowSkillDeleteConfirm(true); };

  return (
    <Card className="mb-8 shadow-lg">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">Manage Skills
          <Dialog open={isCategoryModalOpen} onOpenChange={(isOpen) => { setIsCategoryModalOpen(isOpen); if (!isOpen) { setCurrentCategory(null); setCategoryIconFile(null); categoryForm.reset(); } }}>
            <DialogTrigger asChild><Button onClick={() => handleOpenCategoryModal()}><PlusCircle className="mr-2 h-4 w-4" /> Add Category</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader><DialogTitle>{currentCategory?.id ? 'Edit Skill Category' : 'Add New Skill Category'}</DialogTitle></DialogHeader>
              <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="grid gap-4 py-4">
                <div><Label htmlFor="categoryName">Name</Label><Input id="categoryName" {...categoryForm.register("name")} />{categoryForm.formState.errors.name && <p className="text-destructive text-sm mt-1">{categoryForm.formState.errors.name.message}</p>}</div>
                <div className="space-y-2">
                  <Label htmlFor="category_icon_file">Category Icon File</Label>
                  <div className="flex items-center gap-3"><Input id="category_icon_file" type="file" accept="image/*" onChange={handleCategoryIconFileChange} className="flex-grow" /><UploadCloud className="h-6 w-6 text-muted-foreground" /></div>
                  {(categoryIconPreview) && (<div className="mt-2 p-2 border rounded-md bg-muted aspect-square relative w-24 h-24 mx-auto"><Image src={categoryIconPreview} alt="Icon preview" fill objectFit="contain" className="rounded" /></div>)}
                  <div><Label htmlFor="icon_image_url_category" className="text-xs text-muted-foreground">Or enter Icon Image URL (upload will override).</Label><Input id="icon_image_url_category" {...categoryForm.register("icon_image_url")} placeholder="https://example.com/icon.png" />{categoryForm.formState.errors.icon_image_url && <p className="text-destructive text-sm mt-1">{categoryForm.formState.errors.icon_image_url.message}</p>}</div>
                </div>
                <div><Label htmlFor="sortOrder">Sort Order</Label><Input id="sortOrder" type="number" {...categoryForm.register("sort_order")} /></div>
                <DialogFooter><DialogClose asChild><Button type="button" variant="outline" onClick={() => { setCategoryIconFile(null); categoryForm.reset(); }}>Cancel</Button></DialogClose><Button type="submit">{currentCategory?.id ? 'Save Changes' : 'Add Category'}</Button></DialogFooter>
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
                <AccordionPrimitive.Header className="flex items-center justify-between py-2 px-4 group border-b hover:bg-muted/50 transition-colors">
                    <AccordionPrimitive.Trigger asChild className="flex-grow cursor-pointer py-2">
                       <div className="flex items-center gap-3">
                        {category.iconImageUrl ? (
                            <div className="relative h-6 w-6 rounded-sm overflow-hidden border dark:bg-secondary"><Image src={category.iconImageUrl} alt={category.name} layout="fill" objectFit="contain" /></div>
                        ) : <DefaultCategoryIcon className="h-5 w-5 text-primary"/>}
                        <span className="font-medium text-lg">{category.name}</span>
                        <Badge variant="outline">{category.skills?.length || 0} skills</Badge>
                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180 ml-auto text-muted-foreground group-hover:text-foreground" />
                       </div>
                    </AccordionPrimitive.Trigger>
                    <div className="flex space-x-1.5 shrink-0 ml-3 pl-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleOpenCategoryModal(category);}}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={(e) => { e.stopPropagation(); triggerCategoryDeleteConfirmation(category);}}><Trash2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={(e) => { e.stopPropagation(); handleOpenSkillModal(category.id);}}><PlusCircle className="h-4 w-4"/></Button>
                    </div>
                  </AccordionPrimitive.Header>
                <AccordionContent className="bg-muted/20 p-4 rounded-b-md">
                  {category.skills && category.skills.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {category.skills.map(skill => (
                        <Card key={skill.id} className="p-3 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {skill.iconImageUrl ? (
                                  <div className="relative h-5 w-5 rounded-sm overflow-hidden border dark:bg-secondary"><Image src={skill.iconImageUrl} alt={skill.name} layout="fill" objectFit="contain" /></div>
                              ) : <DefaultSkillIcon className="h-4 w-4 text-muted-foreground"/>}
                              <span className="text-sm font-medium">{skill.name}</span>
                            </div>
                            <div className="flex space-x-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenSkillModal(category.id, skill)}><Edit className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => triggerSkillDeleteConfirmation(skill)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </div>
                          {skill.description && <p className="text-xs text-muted-foreground mt-1.5 pl-7">{skill.description}</p>}
                        </Card>
                      ))}
                    </div>
                  ) : (<p className="text-sm text-muted-foreground text-center py-4">No skills in this category yet. <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => handleOpenSkillModal(category.id)}>Add one?</Button></p>)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
      <Dialog open={isSkillModalOpen} onOpenChange={(isOpen) => { setIsSkillModalOpen(isOpen); if (!isOpen) { setCurrentSkill(null); setParentCategoryIdForNewSkill(null); setSkillIconFile(null); skillForm.reset(); }}}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>{currentSkill?.id ? 'Edit Skill' : 'Add New Skill'}</DialogTitle></DialogHeader>
          <form onSubmit={skillForm.handleSubmit(onSkillSubmit)} className="grid gap-4 py-4">
            <Input type="hidden" {...skillForm.register("category_id")} />
            <div><Label htmlFor="skillName">Name</Label><Input id="skillName" {...skillForm.register("name")} />{skillForm.formState.errors.name && <p className="text-destructive text-sm mt-1">{skillForm.formState.errors.name.message}</p>}</div>
            <div className="space-y-2">
              <Label htmlFor="skill_icon_file">Skill Icon File</Label>
              <div className="flex items-center gap-3"><Input id="skill_icon_file" type="file" accept="image/*" onChange={handleSkillIconFileChange} className="flex-grow" /><UploadCloud className="h-6 w-6 text-muted-foreground"/></div>
              {(skillIconPreview) && (<div className="mt-2 p-2 border rounded-md bg-muted aspect-square relative w-24 h-24 mx-auto"><Image src={skillIconPreview} alt="Icon preview" fill objectFit="contain" className="rounded"/></div>)}
               <div><Label htmlFor="icon_image_url_skill" className="text-xs text-muted-foreground">Or enter Icon Image URL (upload will override).</Label><Input id="icon_image_url_skill" {...skillForm.register("icon_image_url")} placeholder="https://example.com/icon.png"/>{skillForm.formState.errors.icon_image_url && <p className="text-destructive text-sm mt-1">{skillForm.formState.errors.icon_image_url.message}</p>}</div>
            </div>
            <div><Label htmlFor="skillDescription">Description (Optional)</Label><Textarea id="skillDescription" {...skillForm.register("description")} /></div>
            <DialogFooter><DialogClose asChild><Button type="button" variant="outline" onClick={() => { setSkillIconFile(null); skillForm.reset();}}>Cancel</Button></DialogClose><Button type="submit">{currentSkill?.id ? 'Save Changes' : 'Add Skill'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={showCategoryDeleteConfirm} onOpenChange={setShowCategoryDeleteConfirm}>
        <AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground">
          <AlertDialogHeader><AlertDialogTitle className="text-destructive-foreground">Delete Category: {categoryToDelete?.name}?</AlertDialogTitle><AlertDialogDescription className="text-destructive-foreground/90">This will delete the category. Ensure all skills within are moved or deleted first.</AlertDialogDescription></AlertDialogHeader>
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
    </Card>
  );
}

    