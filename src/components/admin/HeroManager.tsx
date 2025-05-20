
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home as HeroIcon, PlusCircle, Edit, Trash2, Link as LinkIconImg, Image as ImageIcon, UploadCloud } from 'lucide-react';
import NextImage from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import type { HeroContent, HeroSocialLinkItem, StoredHeroSocialLink } from '@/types/supabase';
import { useForm, type SubmitHandler, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const PRIMARY_HERO_CONTENT_ID = '00000000-0000-0000-0000-000000000004';

const heroSocialLinkSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1, "Label is required"),
  url: z.string().url("Must be a valid URL"),
  icon_image_url: z.string().url("Must be a valid URL if an image is provided.").optional().or(z.literal("")).nullable(),
});
type HeroSocialLinkFormData = z.infer<typeof heroSocialLinkSchema>;

const heroContentSchema = z.object({
  id: z.string().uuid().default(PRIMARY_HERO_CONTENT_ID),
  main_name: z.string().min(1, "Main name is required.").optional().nullable(),
  subtitles_string: z.string().optional().nullable(),
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
  const currentSocialLinkIconUrlForPreview = socialLinkForm.watch("icon_image_url");


  useEffect(() => {
    fetchHeroContent();
  }, []);

  const fetchHeroContent = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('hero_content')
      .select('id, main_name, subtitles, social_media_links')
      .eq('id', PRIMARY_HERO_CONTENT_ID)
      .maybeSingle();

    if (error) {
      console.error('Error fetching hero content:', JSON.stringify(error, null, 2));
      toast({ title: "Error", description: `Could not fetch Hero content: ${error.message}`, variant: "destructive" });
    } else if (data) {
      const fetchedSocialLinks = (data.social_media_links || []).map((link: StoredHeroSocialLink) => ({
        ...link,
        icon_image_url: link.icon_image_url || null,
        id: crypto.randomUUID(),
      }));
      heroForm.reset({
        id: data.id,
        main_name: data.main_name || '',
        subtitles_string: data.subtitles ? data.subtitles.join(', ') : '',
        social_media_links: fetchedSocialLinks,
      });
    }
    setIsLoading(false);
  };

  const onHeroSubmit: SubmitHandler<HeroContentFormData> = async (formData) => {
    setIsLoading(true);

    const subtitlesArray = formData.subtitles_string
      ? formData.subtitles_string.split(',').map(s => s.trim()).filter(Boolean)
      : null;

    const storedSocialLinks = formData.social_media_links?.map(({ id, ...rest }) => ({
      ...rest,
      icon_image_url: rest.icon_image_url?.trim() === '' ? null : rest.icon_image_url,
    })) || null;

    const dataToUpsert = {
      id: PRIMARY_HERO_CONTENT_ID,
      main_name: formData.main_name || null,
      subtitles: subtitlesArray,
      social_media_links: storedSocialLinks,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from('hero_content')
      .upsert(dataToUpsert, { onConflict: 'id' });

    if (upsertError) {
      console.error("Error saving Hero content:", JSON.stringify(upsertError, null, 2));
      toast({ title: "Error", description: `Failed to save Hero content: ${upsertError.message}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Hero content saved successfully." });
      await supabase.from('admin_activity_log').insert({
        action_type: 'HERO_CONTENT_UPDATED',
        description: `Admin updated the Hero section content.`,
        user_identifier: process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin'
      });
      fetchHeroContent();
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleOpenSocialLinkModal = (link?: HeroSocialLinkItem, index?: number) => {
    setCurrentSocialLinkForEdit(link || null);
    setEditingSocialLinkIndex(index ?? null);
    socialLinkForm.reset(link ? {
      ...link,
      id: link.id || crypto.randomUUID(),
      icon_image_url: link.icon_image_url || ''
    } : { label: '', url: '', icon_image_url: '' });
    setIsSocialLinkModalOpen(true);
  };

  const onSocialLinkSubmitModal: SubmitHandler<HeroSocialLinkFormData> = (data) => {
    const newLinkData = {
      ...data,
      id: currentSocialLinkForEdit?.id || data.id || crypto.randomUUID(),
      icon_image_url: data.icon_image_url?.trim() === '' ? null : data.icon_image_url,
    };
    if (editingSocialLinkIndex !== null) {
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
          <p className="text-center text-muted-foreground">Loading Hero content...</p>
        ) : (
          <form onSubmit={heroForm.handleSubmit(onHeroSubmit)} className="grid gap-6 py-4">
            <ScrollArea className="max-h-[60vh] p-1 pr-3">
              <div className="grid gap-6 p-3">
                <div>
                  <Label htmlFor="main_name">Main Name (e.g., Your Name)</Label>
                  <Input id="main_name" {...heroForm.register("main_name")} placeholder="e.g., Milan" className="w-full"/>
                  {heroForm.formState.errors.main_name && <p className="text-destructive text-sm mt-1">{heroForm.formState.errors.main_name.message}</p>}
                </div>

                <div>
                  <Label htmlFor="subtitles_string">Subtitles (comma-separated for typewriter effect)</Label>
                  <Textarea
                    id="subtitles_string"
                    {...heroForm.register("subtitles_string")}
                    placeholder="e.g., — a Creative Developer, — a Cloud Developer"
                    rows={3}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Enter each subtitle phrase separated by a comma.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                    <Label className="text-lg font-medium self-start sm:self-center">Social Media Links</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleOpenSocialLinkModal()}
                      className="w-full sm:w-auto" // Responsive width
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Social Link
                    </Button>
                  </div>
                  {socialMediaLinksFields.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">No social media links added yet.</p>
                  )}
                  <ScrollArea className="h-auto max-h-[250px] pr-3">
                    <div className="space-y-3">
                      {socialMediaLinksFields.map((field, index) => (
                        <Card key={field.fieldId} className="p-3 bg-muted/50">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-3 flex-grow min-w-0">
                              {field.icon_image_url ? (
                                <div className="relative h-5 w-5 rounded-sm overflow-hidden border bg-background flex-shrink-0">
                                  <NextImage src={field.icon_image_url} alt={field.label} layout="fill" objectFit="contain" className="dark:filter dark:brightness-0 dark:invert" />
                                </div>
                              ) : (
                                <LinkIconImg className="h-4 w-4 text-primary flex-shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate" title={field.label}>{field.label}</p>
                                <p className="text-xs text-muted-foreground truncate" title={field.url}>{field.url}</p>
                              </div>
                            </div>
                            <div className="flex space-x-1.5 flex-shrink-0 self-start sm:self-center mt-2 sm:mt-0">
                              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenSocialLinkModal(field, index)}>
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
                  </ScrollArea>
                </div>
              </div>
            </ScrollArea>
            <Button type="submit" className="w-full sm:w-auto justify-self-start mt-4" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Hero Content'}
            </Button>
          </form>
        )}
      </CardContent>

      <Dialog open={isSocialLinkModalOpen} onOpenChange={(isOpen) => { if (!isOpen) { setCurrentSocialLinkForEdit(null); setEditingSocialLinkIndex(null); socialLinkForm.reset(); } setIsSocialLinkModalOpen(isOpen); }}>
        <DialogContent className="sm:max-w-md md:max-w-lg"> {/* Responsive max-width */}
          <DialogHeader>
            <DialogTitle>{currentSocialLinkForEdit ? 'Edit Social Link' : 'Add New Social Link'}</DialogTitle>
            <DialogDescription>Provide details for the social media link.</DialogDescription>
          </DialogHeader>
          <form onSubmit={socialLinkForm.handleSubmit(onSocialLinkSubmitModal)} className="grid gap-4 py-4">
            <ScrollArea className="max-h-[70vh] p-1"><div className="grid gap-4 p-3">
              <div>
                <Label htmlFor="social_label">Label (e.g., GitHub, LinkedIn) <span className="text-destructive">*</span></Label>
                <Input id="social_label" {...socialLinkForm.register("label")} className="w-full"/>
                {socialLinkForm.formState.errors.label && <p className="text-destructive text-sm mt-1">{socialLinkForm.formState.errors.label.message}</p>}
              </div>
              <div>
                <Label htmlFor="social_url">URL <span className="text-destructive">*</span></Label>
                <Input id="social_url" type="url" {...socialLinkForm.register("url")} placeholder="https://example.com" className="w-full"/>
                {socialLinkForm.formState.errors.url && <p className="text-destructive text-sm mt-1">{socialLinkForm.formState.errors.url.message}</p>}
              </div>
              <div>
                <Label htmlFor="social_icon_image_url">Icon Image URL (Optional)</Label>
                <Input id="social_icon_image_url" {...socialLinkForm.register("icon_image_url")} placeholder="https://example.com/icon.png" className="w-full"/>
                {socialLinkForm.formState.errors.icon_image_url && <p className="text-destructive text-sm mt-1">{socialLinkForm.formState.errors.icon_image_url.message}</p>}
                {currentSocialLinkIconUrlForPreview && (
                  <div className="mt-2 p-1 border rounded-md bg-muted aspect-square relative w-16 h-16">
                    <NextImage src={currentSocialLinkIconUrlForPreview} alt="Icon preview" fill className="object-contain rounded dark:filter dark:brightness-0 dark:invert" />
                  </div>
                )}
              </div>
            </div></ScrollArea>
            <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <DialogClose asChild><Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button></DialogClose>
              <Button type="submit" className="w-full sm:w-auto">{currentSocialLinkForEdit ? 'Save Changes' : 'Add Link'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

    