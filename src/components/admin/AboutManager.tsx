
"use client";

import React, { useEffect, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, UserCircle as AboutMeIcon } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import type { AboutContent } from '@/types/supabase';
import Image from 'next/image';
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from '@/hooks/use-toast';

const PRIMARY_ABOUT_CONTENT_ID = '00000000-0000-0000-0000-000000000001';

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

export default function AboutManager() {
  const router = useRouter();
  const { toast } = useToast();

  const [isLoadingAbout, setIsLoadingAbout] = useState(false);
  const [aboutImageFile, setAboutImageFile] = useState<File | null>(null);
  const [aboutImagePreview, setAboutImagePreview] = useState<string | null>(null);

  const aboutForm = useForm<AboutContentFormData>({
    resolver: zodResolver(aboutContentSchema),
    defaultValues: {
      id: PRIMARY_ABOUT_CONTENT_ID,
      headline_main: '', headline_code_keyword: '', headline_connector: '', headline_creativity_keyword: '',
      paragraph1: '', paragraph2: '', paragraph3: '',
      image_url: '', image_tagline: ''
    }
  });

  const currentAboutImageUrlForPreview = aboutForm.watch('image_url');

  useEffect(() => {
    fetchAboutContent();
  }, []);

  useEffect(() => {
    if (aboutImageFile) {
      const reader = new FileReader();
      reader.onloadend = () => setAboutImagePreview(reader.result as string);
      reader.readAsDataURL(aboutImageFile);
    } else if (aboutForm.getValues('image_url')) {
        setAboutImagePreview(aboutForm.getValues('image_url'));
    }
     else {
      setAboutImagePreview(null);
    }
  }, [aboutImageFile, currentAboutImageUrlForPreview, aboutForm]);

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

  const handleAboutImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setAboutImageFile(event.target.files[0]);
      aboutForm.setValue('image_url', ''); // Clear URL if file is chosen
    } else {
      setAboutImageFile(null);
    }
  };

  const onAboutSubmit: SubmitHandler<AboutContentFormData> = async (formData) => {
    let imageUrlToSave = formData.image_url;

    if (aboutImageFile) {
      const fileExt = aboutImageFile.name.split('.').pop();
      const fileName = `about_me_image.${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`; // Store directly in bucket root for simplicity, or a subfolder
      toast({ title: "Uploading About Me Image", description: "Please wait..." });
      const { error: uploadError } = await supabase.storage
        .from('about-images') // Ensure this bucket exists in Supabase Storage
        .upload(filePath, aboutImageFile, { cacheControl: '3600', upsert: false }); // Use upsert: true if you want to overwrite with the same name

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
      id: PRIMARY_ABOUT_CONTENT_ID, // Ensure ID is always the primary one
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
      fetchAboutContent(); // Refetch to update the form with potentially new image URL from storage
      router.refresh(); // Revalidate public page if it's fetching this data
    }
  };

  return (
    <Card className="mb-8 shadow-lg">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Manage About Content
          <AboutMeIcon className="h-6 w-6 text-primary" />
        </CardTitle>
        <CardDescription>Update the text, image, and tagline for your "About Me" section.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingAbout ? (<p className="text-center text-muted-foreground">Loading About Me content...</p>) : (
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
              <div className="flex items-center gap-3"><Input id="about_image_file" type="file" accept="image/*" onChange={handleAboutImageFileChange} className="flex-grow" /><UploadCloud className="h-6 w-6 text-muted-foreground"/></div>
              {(aboutImagePreview) && (<div className="mt-2 p-2 border rounded-md bg-muted aspect-video relative w-full max-w-sm mx-auto"><Image src={aboutImagePreview} alt="About Me image preview" fill objectFit="contain" className="rounded"/></div>)}
              <div><Label htmlFor="image_url_about" className="text-xs text-muted-foreground">Or enter Image URL (upload will override)</Label><Input id="image_url_about" {...aboutForm.register("image_url")} placeholder="https://example.com/about-image.png" />{aboutForm.formState.errors.image_url && <p className="text-destructive text-sm mt-1">{aboutForm.formState.errors.image_url.message}</p>}</div>
            </div>
            <div><Label htmlFor="image_tagline">Image Tagline</Label><Input id="image_tagline" {...aboutForm.register("image_tagline")} placeholder="e.g., Fuelled by coffee & code."/>{aboutForm.formState.errors.image_tagline && <p className="text-destructive text-sm mt-1">{aboutForm.formState.errors.image_tagline.message}</p>}</div>
            <Button type="submit" className="w-full sm:w-auto justify-self-start">Save About Content</Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

    