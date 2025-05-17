
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users as HeroIcon, PlusCircle, Edit, Trash2, Link as LinkIcon } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import type { HeroContent, HeroSocialLinkItem, StoredHeroSocialLink } from '@/types/supabase';
import { useForm, type SubmitHandler, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

const PRIMARY_HERO_CONTENT_ID = '00000000-0000-0000-0000-000000000004';

const heroSocialLinkSchema = z.object({
  id: z.string().uuid().optional(), // For client-side keying, not stored in JSONB
  label: z.string().min(1, "Label is required"),
  url: z.string().url("Must be a valid URL"),
  icon_name: z.string().min(1, "Lucide icon name is required (e.g., Github, Linkedin)"),
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
  const [currentSocialLink, setCurrentSocialLink] = useState<HeroSocialLinkItem | null>(null);
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
    keyName: "fieldId" // Use a different key name than default 'id' to avoid conflict with our item's 'id'
  });
  
  const socialLinkForm = useForm<HeroSocialLinkFormData>({
    resolver: zodResolver(heroSocialLinkSchema),
    defaultValues: { label: '', url: '', icon_name: ''}
  });

  useEffect(() => {
    fetchHeroContent();
  }, []);

  const fetchHeroContent = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('hero_content')
      .select('*')
      .eq('id', PRIMARY_HERO_CONTENT_ID)
      .maybeSingle();

    if (error) {
      console.error('Error fetching hero content:', JSON.stringify(error, null, 2));
      toast({ title: "Error", description: `Could not fetch Hero content: ${error.message}`, variant: "destructive" });
    } else if (data) {
      const fetchedSocialLinks = (data.social_media_links || []).map((link: StoredHeroSocialLink) => ({
        ...link,
        id: crypto.randomUUID(), // Assign client-side ID for list management
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

    // Prepare social_media_links for storage (remove client-side 'id')
    const storedSocialLinks = formData.social_media_links?.map(({ id, ...rest }) => rest) || null;

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
      fetchHeroContent(); // Re-fetch to update form
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleOpenSocialLinkModal = (link?: HeroSocialLinkItem, index?: number) => {
    setCurrentSocialLink(link || null);
    setEditingSocialLinkIndex(index ?? null);
    socialLinkForm.reset(link ? { ...link, id: link.id || crypto.randomUUID() } : { label: '', url: '', icon_name: '' });
    setIsSocialLinkModalOpen(true);
  };

  const onSocialLinkSubmitModal: SubmitHandler<HeroSocialLinkFormData> = (data) => {
    const newLinkData = { ...data, id: currentSocialLink?.id || data.id || crypto.randomUUID() };
    if (editingSocialLinkIndex !== null) {
      updateSocialLink(editingSocialLinkIndex, newLinkData);
    } else {
      appendSocialLink(newLinkData);
    }
    setIsSocialLinkModalOpen(false);
    setCurrentSocialLink(null);
    setEditingSocialLinkIndex(null);
  };
  
  return (
    <Card className="mb-8 shadow-lg">
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
            <div>
              <Label htmlFor="main_name">Main Name (e.g., Your Name)</Label>
              <Input id="main_name" {...heroForm.register("main_name")} placeholder="e.g., Milan"/>
              {heroForm.formState.errors.main_name && <p className="text-destructive text-sm mt-1">{heroForm.formState.errors.main_name.message}</p>}
            </div>

            <div>
              <Label htmlFor="subtitles_string">Subtitles (comma-separated for typewriter effect)</Label>
              <Textarea 
                id="subtitles_string" 
                {...heroForm.register("subtitles_string")} 
                placeholder="e.g., — a Creative Developer, — a Cloud Developer" 
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">Enter each subtitle phrase separated by a comma.</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-medium">Social Media Links</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => handleOpenSocialLinkModal()}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Social Link
                </Button>
              </div>
              {socialMediaLinksFields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">No social media links added yet.</p>
              )}
              <div className="space-y-3">
                {socialMediaLinksFields.map((field, index) => (
                  <Card key={field.fieldId} className="p-3 bg-muted/50">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-grow min-w-0">
                        <LinkIcon className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="min-w-0">
                           <p className="font-medium text-sm truncate" title={field.label}>{field.label}</p>
                           <p className="text-xs text-muted-foreground truncate" title={field.url}>{field.url}</p>
                           <p className="text-xs text-muted-foreground truncate" title={field.icon_name}>Icon: {field.icon_name}</p>
                        </div>
                      </div>
                      <div className="flex space-x-1.5 flex-shrink-0">
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
            </div>

            <Button type="submit" className="w-full sm:w-auto justify-self-start mt-4" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Hero Content'}
            </Button>
          </form>
        )}
      </CardContent>

      {/* Social Link Modal */}
      <Dialog open={isSocialLinkModalOpen} onOpenChange={(isOpen) => { if (!isOpen) { setCurrentSocialLink(null); setEditingSocialLinkIndex(null); } setIsSocialLinkModalOpen(isOpen); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentSocialLink ? 'Edit Social Link' : 'Add New Social Link'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={socialLinkForm.handleSubmit(onSocialLinkSubmitModal)} className="grid gap-4 py-4">
            <div>
              <Label htmlFor="social_label">Label (e.g., GitHub, LinkedIn)</Label>
              <Input id="social_label" {...socialLinkForm.register("label")} />
              {socialLinkForm.formState.errors.label && <p className="text-destructive text-sm mt-1">{socialLinkForm.formState.errors.label.message}</p>}
            </div>
            <div>
              <Label htmlFor="social_url">URL</Label>
              <Input id="social_url" type="url" {...socialLinkForm.register("url")} placeholder="https://example.com"/>
              {socialLinkForm.formState.errors.url && <p className="text-destructive text-sm mt-1">{socialLinkForm.formState.errors.url.message}</p>}
            </div>
            <div>
              <Label htmlFor="social_icon_name">
                Icon Name (from <a href="https://lucide.dev/icons/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Lucide Icons</a>, e.g., Github, Linkedin)
              </Label>
              <Input id="social_icon_name" {...socialLinkForm.register("icon_name")} placeholder="Github" />
              {socialLinkForm.formState.errors.icon_name && <p className="text-destructive text-sm mt-1">{socialLinkForm.formState.errors.icon_name.message}</p>}
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit">{currentSocialLink ? 'Save Changes' : 'Add Link'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

    