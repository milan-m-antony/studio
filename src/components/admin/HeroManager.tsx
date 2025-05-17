
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users as HeroIcon } from 'lucide-react'; // Using Users as a generic icon for Hero section
import { supabase } from '@/lib/supabaseClient';
import type { HeroContent } from '@/types/supabase';
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from '@/hooks/use-toast';

// Fixed ID for the single hero_content entry in Supabase
const PRIMARY_HERO_CONTENT_ID = '00000000-0000-0000-0000-000000000004';

// Zod schema for form validation
const heroContentSchema = z.object({
  id: z.string().uuid().default(PRIMARY_HERO_CONTENT_ID),
  main_name: z.string().min(1, "Main name is required.").optional().nullable(),
  subtitles_string: z.string().optional().nullable(), // For comma-separated input
  social_github_url: z.string().url("Must be a valid URL if provided.").optional().or(z.literal("")).nullable(),
  social_linkedin_url: z.string().url("Must be a valid URL if provided.").optional().or(z.literal("")).nullable(),
  social_instagram_url: z.string().url("Must be a valid URL if provided.").optional().or(z.literal("")).nullable(),
  social_facebook_url: z.string().url("Must be a valid URL if provided.").optional().or(z.literal("")).nullable(),
});
type HeroContentFormData = z.infer<typeof heroContentSchema>;

export default function HeroManager() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const heroForm = useForm<HeroContentFormData>({
    resolver: zodResolver(heroContentSchema),
    defaultValues: {
      id: PRIMARY_HERO_CONTENT_ID,
      main_name: '',
      subtitles_string: '',
      social_github_url: '',
      social_linkedin_url: '',
      social_instagram_url: '',
      social_facebook_url: '',
    }
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
      heroForm.reset({
        id: data.id,
        main_name: data.main_name || '',
        subtitles_string: data.subtitles ? data.subtitles.join(', ') : '',
        social_github_url: data.social_github_url || '',
        social_linkedin_url: data.social_linkedin_url || '',
        social_instagram_url: data.social_instagram_url || '',
        social_facebook_url: data.social_facebook_url || '',
      });
    }
    setIsLoading(false);
  };

  const onHeroSubmit: SubmitHandler<HeroContentFormData> = async (formData) => {
    setIsLoading(true);

    const subtitlesArray = formData.subtitles_string
      ? formData.subtitles_string.split(',').map(s => s.trim()).filter(Boolean)
      : null;

    const dataToUpsert: Omit<HeroContent, 'updated_at'> & { id: string } = {
      id: PRIMARY_HERO_CONTENT_ID,
      main_name: formData.main_name || null,
      subtitles: subtitlesArray,
      social_github_url: formData.social_github_url || null,
      social_linkedin_url: formData.social_linkedin_url || null,
      social_instagram_url: formData.social_instagram_url || null,
      social_facebook_url: formData.social_facebook_url || null,
    };
    
    const { error: upsertError } = await supabase
      .from('hero_content')
      .upsert({ ...dataToUpsert, updated_at: new Date().toISOString() }, { onConflict: 'id' });

    if (upsertError) {
      console.error("Error saving Hero content:", JSON.stringify(upsertError, null, 2));
      toast({ title: "Error", description: `Failed to save Hero content: ${upsertError.message}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Hero content saved successfully." });
      fetchHeroContent(); // Re-fetch to update form with potentially processed data (e.g., cleaned subtitles)
      router.refresh(); // Refresh server components on the public page
    }
    setIsLoading(false);
  };

  return (
    <Card className="mb-8 shadow-lg">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Manage Hero Section Content
          <HeroIcon className="h-6 w-6 text-primary" />
        </CardTitle>
        <CardDescription>Update the main name, subtitles for the typewriter, and social media links for your hero section.</CardDescription>
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
                placeholder="e.g., — a Creative Developer, — a Cloud Developer, — a Web Designer" 
                rows={3}
              />
              {heroForm.formState.errors.subtitles_string && <p className="text-destructive text-sm mt-1">{heroForm.formState.errors.subtitles_string.message}</p>}
              <p className="text-xs text-muted-foreground mt-1">Enter each subtitle phrase separated by a comma.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="social_github_url">GitHub URL</Label>
                <Input id="social_github_url" {...heroForm.register("social_github_url")} placeholder="https://github.com/yourusername"/>
                {heroForm.formState.errors.social_github_url && <p className="text-destructive text-sm mt-1">{heroForm.formState.errors.social_github_url.message}</p>}
              </div>
              <div>
                <Label htmlFor="social_linkedin_url">LinkedIn URL</Label>
                <Input id="social_linkedin_url" {...heroForm.register("social_linkedin_url")} placeholder="https://linkedin.com/in/yourusername"/>
                {heroForm.formState.errors.social_linkedin_url && <p className="text-destructive text-sm mt-1">{heroForm.formState.errors.social_linkedin_url.message}</p>}
              </div>
              <div>
                <Label htmlFor="social_instagram_url">Instagram URL</Label>
                <Input id="social_instagram_url" {...heroForm.register("social_instagram_url")} placeholder="https://instagram.com/yourusername"/>
                {heroForm.formState.errors.social_instagram_url && <p className="text-destructive text-sm mt-1">{heroForm.formState.errors.social_instagram_url.message}</p>}
              </div>
              <div>
                <Label htmlFor="social_facebook_url">Facebook URL</Label>
                <Input id="social_facebook_url" {...heroForm.register("social_facebook_url")} placeholder="https://facebook.com/yourusername"/>
                {heroForm.formState.errors.social_facebook_url && <p className="text-destructive text-sm mt-1">{heroForm.formState.errors.social_facebook_url.message}</p>}
              </div>
            </div>

            <Button type="submit" className="w-full sm:w-auto justify-self-start" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Hero Content'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

    