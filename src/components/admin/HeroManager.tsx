
"use client";

import React, { useEffect, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Home as HeroIcon, PlusCircle, Edit, Trash2, Save, ImageIcon, Link as GenericLinkIcon } from 'lucide-react';
import NextImage from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import type { HeroContent, StoredHeroSocialLink, HeroSocialLinkItem } from '@/types/supabase';
import { useForm, type SubmitHandler, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const PRIMARY_HERO_CONTENT_ID = '00000000-0000-0000-0000-000000000004';

// Updated to use icon_image_url
const heroSocialLinkSchema = z.object({
  id: z.string().uuid().optional(), // Client-side only for useFieldArray key
  label: z.string().min(1, "Label is required"),
  url: z.string().url("Must be a valid URL"),
  icon_image_url: z.string().url("Must be a valid URL if provided.").optional().or(z.literal("")).nullable(),
});
type HeroSocialLinkFormData = z.infer<typeof heroSocialLinkSchema>;

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

  // Form for the social link modal
  const socialLinkForm = useForm<HeroSocialLinkFormData>({
    resolver: zodResolver(heroSocialLinkSchema),
    defaultValues: { label: '', url: '', icon_image_url: '' }
  });
  
  const watchedSocialLinkIconUrlInModal = socialLinkForm.watch("icon_image_url");

  const fetchHeroContent = async () => {
    setIsLoading(true);
    console.log("[HeroManager] Fetching hero content for ID:", PRIMARY_HERO_CONTENT_ID);
    const { data, error } = await supabase
      .from('hero_content')
      .select('id, main_name, subtitles, social_media_links') // social_media_links is JSONB
      .eq('id', PRIMARY_HERO_CONTENT_ID)
      .maybeSingle();

    if (error) {
      console.error("[HeroManager] Error fetching Hero content:", JSON.stringify(error, null, 2));
      toast({ title: "Error", description: `Could not fetch Hero content: ${error.message}`, variant: "destructive" });
      heroForm.reset({ id: PRIMARY_HERO_CONTENT_ID, main_name: 'Error Loading', subtitles_string: '', social_media_links: [] });
    } else if (data) {
      console.log("[HeroManager] Fetched hero data from Supabase:", JSON.stringify(data, null, 2));
      
      let fetchedSocialLinks: HeroSocialLinkItem[] = [];
      if (data.social_media_links && Array.isArray(data.social_media_links)) {
        // Map database StoredHeroSocialLink to client-side HeroSocialLinkItem, adding a client-side ID
        fetchedSocialLinks = (data.social_media_links as StoredHeroSocialLink[]).map(link => ({
          ...link, // contains label, url, icon_image_url
          id: crypto.randomUUID(), // Ensure a NEW client-side ID for useFieldArray
        }));
      } else if (data.social_media_links) {
        console.warn("[HeroManager] social_media_links from DB is not an array or is null:", data.social_media_links);
      }
      console.log("[HeroManager] Mapped fetchedSocialLinks for form reset:", JSON.stringify(fetchedSocialLinks, null, 2));
        
      heroForm.reset({
        id: data.id || PRIMARY_HERO_CONTENT_ID,
        main_name: data.main_name || '',
        subtitles_string: data.subtitles && Array.isArray(data.subtitles) ? data.subtitles.join(', ') : '',
        social_media_links: fetchedSocialLinks,
      });
    } else {
      console.log("[HeroManager] No hero content found, resetting form to defaults.");
      heroForm.reset({ id: PRIMARY_HERO_CONTENT_ID, main_name: '', subtitles_string: '', social_media_links: [] });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchHeroContent();
  }, []);


  const onHeroSubmit: SubmitHandler<HeroContentFormData> = async (formData) => {
    setIsLoading(true);
    console.log("[HeroManager] onHeroSubmit - formData.social_media_links (from form state):", JSON.stringify(formData.social_media_links, null, 2));

    const subtitlesArray = formData.subtitles_string
      ?.split(',')
      .map(s => s.trim())
      .filter(Boolean);
    
    // Prepare social_media_links for Supabase (strip client-side 'id'/'fieldId', ensure correct structure)
    const storedSocialLinks: StoredHeroSocialLink[] = (formData.social_media_links || []).map(link => {
      const { id, fieldId, ...rest } = link as any; // fieldId is from useFieldArray, id is our client UUID
      return {
        label: rest.label,
        url: rest.url,
        icon_image_url: rest.icon_image_url?.trim() === '' ? null : rest.icon_image_url,
      };
    });
    console.log("[HeroManager] onHeroSubmit - prepared storedSocialLinks for Supabase:", JSON.stringify(storedSocialLinks, null, 2));

    const dataToUpsert = {
      id: PRIMARY_HERO_CONTENT_ID,
      main_name: formData.main_name || null,
      subtitles: subtitlesArray && subtitlesArray.length > 0 ? subtitlesArray : null, // Store as array
      social_media_links: storedSocialLinks.length > 0 ? storedSocialLinks : [], // Store as JSONB array
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
      await fetchHeroContent(); // Re-fetch to ensure form state is perfectly aligned with DB
      router.refresh(); // Revalidate public page
    }
    setIsLoading(false);
  };

  // Handler for opening the social link modal (for add or edit)
  const handleOpenSocialLinkModal = (link?: HeroSocialLinkItem, index?: number) => {
    setCurrentSocialLinkForEdit(link || null);
    setEditingSocialLinkIndex(index ?? null);
    socialLinkForm.reset(link ? {
      label: link.label,
      url: link.url,
      icon_image_url: link.icon_image_url || '' // Use icon_image_url here
    } : { label: '', url: '', icon_image_url: '' });
    setIsSocialLinkModalOpen(true);
  };

  // Handler for submitting the social link modal form
  const onSocialLinkSubmitModal: SubmitHandler<HeroSocialLinkFormData> = (data) => {
    const newLinkData: HeroSocialLinkItem = {
      ...data, // label, url, icon_image_url
      id: currentSocialLinkForEdit?.id || crypto.randomUUID(), // Keep client-side ID or generate new
      icon_image_url: data.icon_image_url?.trim() === '' ? null : data.icon_image_url,
    };

    if (editingSocialLinkIndex !== null && editingSocialLinkIndex >= 0) {
      updateSocialLink(editingSocialLinkIndex, newLinkData);
      console.log("[HeroManager] Updated social link in form state at index", editingSocialLinkIndex, heroForm.getValues('social_media_links'));
    } else {
      appendSocialLink(newLinkData);
      console.log("[HeroManager] Appended social link to form state:", heroForm.getValues('social_media_links'));
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
                      variant="default" // Changed from outline
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
                      <Card key={field.fieldId} className="p-3 bg-muted/50 hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          {/* Icon and Text part */}
                          <div className="flex items-center gap-2 sm:gap-3 flex-grow min-w-0">
                            <div className="relative h-6 w-6 rounded-sm overflow-hidden border bg-card flex items-center justify-center flex-shrink-0">
                              {field.icon_image_url ? (
                                <img src={field.icon_image_url} alt={field.label || "Icon"} className="max-h-full max-w-full object-contain" />
                              ) : (
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0 flex-grow">
                              <p className="font-medium text-sm truncate" title={field.label || 'No Label'}>
                                {field.label || '(No Label)'}
                              </p>
                              <p className="text-xs text-muted-foreground break-all" title={field.url || 'No URL'}> {/* Changed from truncate to break-all */}
                                {field.url || '(No URL)'}
                              </p>
                            </div>
                          </div>
                          {/* Action buttons part */}
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

      {/* Modal for Adding/Editing Social Links */}
      <Dialog open={isSocialLinkModalOpen} onOpenChange={(isOpen) => { if (!isOpen) { setCurrentSocialLinkForEdit(null); setEditingSocialLinkIndex(null); socialLinkForm.reset(); } setIsSocialLinkModalOpen(isOpen); }}>
        <DialogContent className="sm:max-w-lg"> 
          <DialogHeader>
            <DialogTitle>{currentSocialLinkForEdit ? 'Edit Social Link' : 'Add New Social Link'}</DialogTitle>
            <DialogDescription>Provide details for the social media link. Use a direct image URL for the icon.</DialogDescription>
          </DialogHeader>
          <form onSubmit={socialLinkForm.handleSubmit(onSocialLinkSubmitModal)} className="grid gap-4 py-4">
            <ScrollArea className="max-h-[70vh] p-1">
              <div className="grid gap-4 p-2"> 
                <div className="space-y-1"> 
                  <Label htmlFor="social_label_hero" className="text-sm">Label <span className="text-destructive">*</span></Label>
                  <Input id="social_label_hero" {...socialLinkForm.register("label")} placeholder="e.g., GitHub, LinkedIn" className="w-full"/>
                  {socialLinkForm.formState.errors.label && <p className="text-destructive text-sm mt-1">{socialLinkForm.formState.errors.label.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="social_url_hero" className="text-sm">URL <span className="text-destructive">*</span></Label>
                  <Input id="social_url_hero" type="url" {...socialLinkForm.register("url")} placeholder="https://example.com" className="w-full"/>
                  {socialLinkForm.formState.errors.url && <p className="text-destructive text-sm mt-1">{socialLinkForm.formState.errors.url.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="social_icon_image_url_hero" className="text-sm">Icon Image URL (Optional)</Label>
                  <Input id="social_icon_image_url_hero" {...socialLinkForm.register("icon_image_url")} placeholder="https://image.url/icon.png or data:image/svg..." className="w-full"/>
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
                    <div className="mt-2 text-xs text-muted-foreground">No preview available. Enter a valid image URL.</div>
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

    