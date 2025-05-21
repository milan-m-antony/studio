
"use client";

import React, { useEffect, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Home as HeroIcon, PlusCircle, Edit, Trash2, Save, Link as GenericLinkIcon } from 'lucide-react';
import NextImage from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import type { HeroContent, StoredHeroSocialLink, HeroSocialLinkItem } from '@/types/supabase';
import { useForm, type SubmitHandler, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// This ID MUST match the one in your Supabase 'hero_content' table for the single row.
const PRIMARY_HERO_CONTENT_ID = '00000000-0000-0000-0000-000000000004';

// Schema for individual social links (for the modal form)
const heroSocialLinkSchema = z.object({
  id: z.string().uuid().optional(), // Client-side only for useFieldArray
  label: z.string().min(1, "Label is required"),
  url: z.string().url("Must be a valid URL"),
  icon_image_url: z.string().url("Must be a valid URL if provided.").optional().or(z.literal("")).nullable(),
});
type HeroSocialLinkFormData = z.infer<typeof heroSocialLinkSchema>;

// Main schema for hero content
const heroContentSchema = z.object({
  id: z.string().uuid().default(PRIMARY_HERO_CONTENT_ID),
  main_name: z.string().min(1, "Main name is required.").optional().nullable(),
  subtitles_string: z.string().optional().nullable(), // For comma-separated input
  social_media_links: z.array(heroSocialLinkSchema).optional().default([]),
});
type HeroContentFormData = z.infer<typeof heroContentSchema>;


export default function HeroManager() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [isSocialLinkModalOpen, setIsSocialLinkModalOpen] = useState(false);
  const [currentSocialLinkForEdit, setCurrentSocialLinkForEdit] = useState<HeroSocialLinkItem | null>(null);
  const [editingSocialLinkIndex, setEditingSocialLinkIndex] = useState<number | null>(null);
  
  const heroForm = useForm<HeroContentFormData>({
    resolver: zodResolver(heroContentSchema),
    defaultValues: {
      id: PRIMARY_HERO_CONTENT_ID,
      main_name: '',
      subtitles_string: '',
      social_media_links: [],
    }
  });

  const { fields: socialMediaLinksFields, append: appendSocialLink, remove: removeSocialLink, update: updateSocialLink } = useFieldArray({
    control: heroForm.control,
    name: "social_media_links",
    keyName: "fieldId" 
  });

  const socialLinkForm = useForm<HeroSocialLinkFormData>({
    resolver: zodResolver(heroSocialLinkSchema),
    defaultValues: { label: '', url: '', icon_image_url: '' }
  });
  
  const watchedSocialLinkIconUrlInModal = socialLinkForm.watch("icon_image_url");


  useEffect(() => {
    fetchHeroContent();
  }, []);

  const fetchHeroContent = async () => {
    setIsLoading(true);
    console.log("[HeroManager] Fetching hero content for ID:", PRIMARY_HERO_CONTENT_ID);
    const { data, error } = await supabase
      .from('hero_content')
      .select('id, main_name, subtitles, social_media_links')
      .eq('id', PRIMARY_HERO_CONTENT_ID)
      .maybeSingle();

    if (error) {
      console.error("[HeroManager] Error fetching Hero content:", JSON.stringify(error, null, 2));
      toast({ title: "Error", description: `Could not fetch Hero content: ${error.message}`, variant: "destructive" });
      // Set defaults even on error to prevent form from breaking
      heroForm.reset({
        id: PRIMARY_HERO_CONTENT_ID,
        main_name: 'Error Loading Name',
        subtitles_string: 'Error loading subtitles',
        social_media_links: [],
      });
    } else if (data) {
      console.log("[HeroManager] Fetched hero data from Supabase:", JSON.stringify(data, null, 2));
      
      let fetchedSocialLinks: HeroSocialLinkItem[] = [];
      if (data.social_media_links && Array.isArray(data.social_media_links)) {
        // Ensure each item from DB gets a new client-side ID for useFieldArray
        fetchedSocialLinks = (data.social_media_links as StoredHeroSocialLink[]).map(link => ({
          id: crypto.randomUUID(), // Always generate a new client-side ID
          label: link.label || '',
          url: link.url || '',
          icon_image_url: link.icon_image_url || null,
        }));
      } else if (data.social_media_links) {
        console.warn("[HeroManager] social_media_links from DB is not an array:", data.social_media_links);
      }
        
      heroForm.reset({
        id: data.id || PRIMARY_HERO_CONTENT_ID,
        main_name: data.main_name || '',
        subtitles_string: data.subtitles && Array.isArray(data.subtitles) ? data.subtitles.join(', ') : '',
        social_media_links: fetchedSocialLinks,
      });
      console.log("[HeroManager] Form reset with social_media_links:", JSON.stringify(fetchedSocialLinks, null, 2));
    } else {
      console.log("[HeroManager] No hero content found for this ID, resetting form to defaults.");
      heroForm.reset({
        id: PRIMARY_HERO_CONTENT_ID,
        main_name: '',
        subtitles_string: '',
        social_media_links: [],
      });
    }
    setIsLoading(false);
  };

  const onHeroSubmit: SubmitHandler<HeroContentFormData> = async (formData) => {
    setIsLoading(true);
    const subtitlesArray = formData.subtitles_string
      ?.split(',')
      .map(s => s.trim())
      .filter(Boolean);
    
    const storedSocialLinks: StoredHeroSocialLink[] = (formData.social_media_links || []).map(link => {
      const { id, fieldId, ...rest } = link as any; // Remove client-side specific IDs like 'id' and 'fieldId'
      return {
        ...rest, // This should include label, url, icon_image_url
        icon_image_url: link.icon_image_url?.trim() === '' ? null : link.icon_image_url,
      };
    });

    const dataToUpsert = {
      id: PRIMARY_HERO_CONTENT_ID,
      main_name: formData.main_name || null,
      subtitles: subtitlesArray && subtitlesArray.length > 0 ? subtitlesArray : null,
      social_media_links: storedSocialLinks.length > 0 ? storedSocialLinks : [], // Send empty JS array
      updated_at: new Date().toISOString(),
    };

    console.log("[HeroManager] Data being upserted to Supabase:", JSON.stringify(dataToUpsert, null, 2));
    
    const { error: upsertError, data: upsertedData } = await supabase
      .from('hero_content')
      .upsert(dataToUpsert, { onConflict: 'id' })
      .select() 
      .single();

    if (upsertError) {
      console.error("[HeroManager] Error saving Hero content:", JSON.stringify(upsertError, null, 2));
      toast({ title: "Error", description: `Failed to save Hero content: ${upsertError.message}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Hero content saved." });
      console.log("[HeroManager] Hero content successfully saved/upserted:", JSON.stringify(upsertedData, null, 2));
      await fetchHeroContent(); // Re-fetch to ensure form state is in sync with DB
      router.refresh(); 
    }
    setIsLoading(false);
  };

  const handleOpenSocialLinkModal = (link?: HeroSocialLinkItem, index?: number) => {
    setCurrentSocialLinkForEdit(link || null);
    setEditingSocialLinkIndex(index ?? null);
    socialLinkForm.reset(link ? {
      label: link.label,
      url: link.url,
      icon_image_url: link.icon_image_url || ''
    } : { label: '', url: '', icon_image_url: '' });
    setIsSocialLinkModalOpen(true);
  };

  const onSocialLinkSubmitModal: SubmitHandler<HeroSocialLinkFormData> = (data) => {
    const newLinkData: HeroSocialLinkItem = {
      ...data,
      id: currentSocialLinkForEdit?.id || crypto.randomUUID(), // Preserve existing client ID or generate new
      icon_image_url: data.icon_image_url?.trim() === '' ? null : data.icon_image_url,
    };

    if (editingSocialLinkIndex !== null && editingSocialLinkIndex >= 0) {
      updateSocialLink(editingSocialLinkIndex, newLinkData);
    } else {
      appendSocialLink(newLinkData);
    }
    setIsSocialLinkModalOpen(false);
    setCurrentSocialLinkForEdit(null);
    setEditingSocialLinkIndex(null);
    socialLinkForm.reset({ label: '', url: '', icon_image_url: '' });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Manage Hero Section Content
          <HeroIcon className="h-6 w-6 text-primary" />
        </CardTitle>
        <CardDescription>Update the main name, subtitles for the typewriter, and dynamic social media links.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && !heroForm.formState.isDirty ? (
          <p className="text-center text-muted-foreground py-4">Loading Hero content...</p>
        ) : (
          <form onSubmit={heroForm.handleSubmit(onHeroSubmit)} className="grid gap-6 py-4">
            <ScrollArea className="max-h-[calc(100vh-22rem)] p-1 pr-3">
              <div className="grid gap-6 p-3">
                <div className="space-y-2">
                  <Label htmlFor="main_name">Main Name (e.g., Your Name)</Label>
                  <Input id="main_name" {...heroForm.register("main_name")} placeholder="e.g., Milan M Antony" className="w-full"/>
                  {heroForm.formState.errors.main_name && <p className="text-destructive text-sm mt-1">{heroForm.formState.errors.main_name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitles_string">Subtitles (comma-separated for typewriter effect)</Label>
                  <Textarea
                    id="subtitles_string"
                    {...heroForm.register("subtitles_string")}
                    placeholder="e.g., — a Creative Developer, — a Cloud Support Engineer"
                    rows={3}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Enter each subtitle phrase separated by a comma.</p>
                </div>

                <div className="space-y-4">
                  <div className="mb-4">
                    <Label className="text-lg font-medium block mb-2">Social Media Links</Label>
                    <Button 
                      type="button" 
                      variant="default"
                      size="sm" 
                      onClick={() => handleOpenSocialLinkModal()}
                      className="w-full sm:w-auto"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Social Link
                    </Button>
                  </div>

                  {socialMediaLinksFields.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">No social media links added yet.</p>
                  )}
                  <div className="space-y-3">
                    {socialMediaLinksFields.map((field, index) => (
                      <Card key={field.fieldId} className="p-3 bg-card hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 flex-grow min-w-0">
                            {field.icon_image_url && typeof field.icon_image_url === 'string' && field.icon_image_url.trim() !== '' ? (
                               <div className="relative h-5 w-5 rounded-sm overflow-hidden border bg-muted flex-shrink-0 flex items-center justify-center">
                                <img 
                                  src={field.icon_image_url} 
                                  alt={`${field.label || 'Icon'} preview`} 
                                  className="max-h-full max-w-full object-contain" // Use <img> for admin preview
                                />
                              </div>
                            ) : (
                              <GenericLinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <div className="min-w-0 flex-grow">
                              <p className="font-medium text-sm truncate" title={field.label || 'No Label'}>{field.label || '(No Label)'}</p>
                              <p className="text-xs text-muted-foreground truncate" title={field.url || 'No URL'}>{field.url || '(No URL)'}</p>
                            </div>
                          </div>
                          <div className="flex space-x-1.5 flex-shrink-0 self-start sm:self-center mt-2 sm:mt-0">
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenSocialLinkModal(field as HeroSocialLinkItem, index)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => removeSocialLink(index)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
             <CardFooter className="pt-6">
                <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" /> {isLoading ? 'Saving...' : 'Save Hero Content'}
                </Button>
            </CardFooter>
          </form>
        )}
      </CardContent>

      <Dialog open={isSocialLinkModalOpen} onOpenChange={(isOpen) => { if (!isOpen) { setCurrentSocialLinkForEdit(null); setEditingSocialLinkIndex(null); socialLinkForm.reset(); } setIsSocialLinkModalOpen(isOpen); }}>
        <DialogContent className="sm:max-w-lg"> 
          <DialogHeader>
            <DialogTitle>{currentSocialLinkForEdit ? 'Edit Social Link' : 'Add New Social Link'}</DialogTitle>
            <DialogDescription>Provide details for the social media link.</DialogDescription>
          </DialogHeader>
          <form onSubmit={socialLinkForm.handleSubmit(onSocialLinkSubmitModal)} className="grid gap-4 py-4">
            <ScrollArea className="max-h-[70vh] p-1">
              <div className="grid gap-4 p-2"> 
                <div className="space-y-1"> 
                  <Label htmlFor="social_label" className="text-sm">Label <span className="text-destructive">*</span></Label>
                  <Input id="social_label" {...socialLinkForm.register("label")} placeholder="e.g., GitHub, LinkedIn" className="w-full"/>
                  {socialLinkForm.formState.errors.label && <p className="text-destructive text-sm mt-1">{socialLinkForm.formState.errors.label.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="social_url" className="text-sm">URL <span className="text-destructive">*</span></Label>
                  <Input id="social_url" type="url" {...socialLinkForm.register("url")} placeholder="https://example.com" className="w-full"/>
                  {socialLinkForm.formState.errors.url && <p className="text-destructive text-sm mt-1">{socialLinkForm.formState.errors.url.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="social_icon_image_url" className="text-sm">Icon Image URL (Optional)</Label>
                  <Input id="social_icon_image_url" {...socialLinkForm.register("icon_image_url")} placeholder="https://image.url/icon.png or data:image/svg..." className="w-full"/>
                  {socialLinkForm.formState.errors.icon_image_url && <p className="text-destructive text-sm mt-1">{socialLinkForm.formState.errors.icon_image_url.message}</p>}
                  
                  {watchedSocialLinkIconUrlInModal && typeof watchedSocialLinkIconUrlInModal === 'string' && watchedSocialLinkIconUrlInModal.trim() !== '' ? (
                    <div className="mt-2 flex items-center gap-1"> 
                      <span className="text-xs text-muted-foreground">Preview:</span>
                      <div className="relative h-6 w-6 rounded-sm overflow-hidden border bg-muted flex items-center justify-center">
                          <img 
                              src={watchedSocialLinkIconUrlInModal} 
                              alt="Icon Preview" 
                              className="max-h-full max-w-full object-contain"
                          />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-muted-foreground">No preview available or URL invalid.</div>
                  )}
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 border-t sm:justify-end">
              <DialogClose asChild><Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button></DialogClose>
              <Button type="submit" className="w-full sm:w-auto">{currentSocialLinkForEdit ? 'Save Changes' : 'Add Link'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
