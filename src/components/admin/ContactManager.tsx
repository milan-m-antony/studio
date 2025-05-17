
"use client";

import React, { useEffect, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Mail, Link as LinkIcon, Phone, MapPin, Save, Image as ImageIcon } from 'lucide-react'; // Added ImageIcon
import { supabase } from '@/lib/supabaseClient';
import type { ContactPageDetail, SocialLink } from '@/types/supabase';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import NextImage from 'next/image'; // For image previews

const PRIMARY_CONTACT_DETAILS_ID = '00000000-0000-0000-0000-000000000005'; // Fixed ID

// Zod Schemas
const contactPageDetailsSchema = z.object({
  id: z.string().uuid().default(PRIMARY_CONTACT_DETAILS_ID),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  phone_href: z.string().optional().nullable(),
  email: z.string().email({ message: "Invalid email address" }).optional().or(z.literal("")).nullable(),
  email_href: z.string().optional().nullable(),
});
type ContactPageDetailsFormData = z.infer<typeof contactPageDetailsSchema>;

const socialLinkSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1, "Label is required"),
  icon_image_url: z.string().url("Must be a valid URL if provided.").optional().or(z.literal("")).nullable(), // Changed from icon_name
  url: z.string().url("Must be a valid URL"),
  display_text: z.string().optional().nullable(),
  sort_order: z.coerce.number().optional().default(0),
});
type SocialLinkFormData = z.infer<typeof socialLinkSchema>;

export default function ContactManager() {
  const router = useRouter();
  const { toast } = useToast();

  const [isLoadingContactDetails, setIsLoadingContactDetails] = useState(false);
  const contactDetailsForm = useForm<ContactPageDetailsFormData>({
    resolver: zodResolver(contactPageDetailsSchema),
    defaultValues: {
      id: PRIMARY_CONTACT_DETAILS_ID,
      address: '', phone: '', phone_href: '', email: '', email_href: ''
    }
  });

  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [isLoadingSocialLinks, setIsLoadingSocialLinks] = useState(false);
  const [isSocialLinkModalOpen, setIsSocialLinkModalOpen] = useState(false);
  const [currentSocialLink, setCurrentSocialLink] = useState<SocialLink | null>(null);
  const [showSocialLinkDeleteConfirm, setShowSocialLinkDeleteConfirm] = useState(false);
  const [socialLinkToDelete, setSocialLinkToDelete] = useState<SocialLink | null>(null);
  const socialLinkForm = useForm<SocialLinkFormData>({
    resolver: zodResolver(socialLinkSchema),
    defaultValues: { label: '', icon_image_url: '', url: '', display_text: '', sort_order: 0 }
  });

  const fetchContactDetails = async () => {
    setIsLoadingContactDetails(true);
    const { data, error } = await supabase
      .from('contact_page_details')
      .select('*')
      .eq('id', PRIMARY_CONTACT_DETAILS_ID)
      .maybeSingle();
    if (error) {
      toast({ title: "Error", description: `Could not fetch contact details: ${error.message}`, variant: "destructive" });
    } else if (data) {
      contactDetailsForm.reset(data);
    }
    setIsLoadingContactDetails(false);
  };

  const fetchSocialLinks = async () => {
    setIsLoadingSocialLinks(true);
    const { data, error } = await supabase
      .from('social_links')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      toast({ title: "Error", description: `Could not fetch social links: ${error.message}`, variant: "destructive" });
      setSocialLinks([]);
    } else {
      setSocialLinks(data.map(link => ({ ...link, icon_image_url: link.icon_image_url || null })) || []);
    }
    setIsLoadingSocialLinks(false);
  };

  useEffect(() => {
    fetchContactDetails();
    fetchSocialLinks();
  }, []);

  const onContactDetailsSubmit: SubmitHandler<ContactPageDetailsFormData> = async (formData) => {
    setIsLoadingContactDetails(true);
    const dataToUpsert = {
      ...formData,
      id: PRIMARY_CONTACT_DETAILS_ID,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from('contact_page_details')
      .upsert(dataToUpsert, { onConflict: 'id' });

    if (error) {
      toast({ title: "Error", description: `Failed to save contact details: ${error.message}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Contact details saved successfully." });
      fetchContactDetails();
      router.refresh();
    }
    setIsLoadingContactDetails(false);
  };

  const onSocialLinkSubmit: SubmitHandler<SocialLinkFormData> = async (formData) => {
    const dataToSave = {
      ...formData,
      icon_image_url: formData.icon_image_url?.trim() === '' ? null : formData.icon_image_url, // Changed from icon_name
      display_text: formData.display_text || null,
      sort_order: Number(formData.sort_order) || 0,
    };

    let response;
    if (formData.id) {
      response = await supabase.from('social_links').update(dataToSave).eq('id', formData.id).select();
    } else {
      const { id, ...insertData } = dataToSave;
      response = await supabase.from('social_links').insert(insertData).select();
    }

    if (response.error) {
      toast({ title: "Error", description: `Failed to save social link: ${response.error.message}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Social link ${formData.id ? 'updated' : 'added'} successfully.` });
      fetchSocialLinks();
      setIsSocialLinkModalOpen(false);
      router.refresh();
    }
  };

  const handleDeleteSocialLink = async () => {
    if (!socialLinkToDelete) return;
    // Note: If social link icons were uploaded to Supabase Storage, add deletion logic here.
    // For now, we assume URLs are external or managed elsewhere.
    const { error } = await supabase.from('social_links').delete().eq('id', socialLinkToDelete.id);
    if (error) {
      toast({ title: "Error", description: `Failed to delete social link: ${error.message}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Social link deleted." });
      fetchSocialLinks();
    }
    setShowSocialLinkDeleteConfirm(false);
    setSocialLinkToDelete(null);
    router.refresh();
  };

  const handleOpenSocialLinkModal = (link?: SocialLink) => {
    setCurrentSocialLink(link || null);
    socialLinkForm.reset(link ? { ...link, icon_image_url: link.icon_image_url || '', sort_order: link.sort_order ?? 0 } : { label: '', icon_image_url: '', url: '', display_text: '', sort_order: 0 });
    setIsSocialLinkModalOpen(true);
  };

  const triggerSocialLinkDeleteConfirmation = (link: SocialLink) => {
    setSocialLinkToDelete(link);
    setShowSocialLinkDeleteConfirm(true);
  };
  
  const currentSocialLinkIconUrl = socialLinkForm.watch("icon_image_url");

  return (
    <>
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Manage Contact Page Information
            <Mail className="h-6 w-6 text-primary" />
          </CardTitle>
          <CardDescription>Update the address, phone, and email displayed on your contact page.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingContactDetails ? (
            <p className="text-center text-muted-foreground">Loading contact details...</p>
          ) : (
            <form onSubmit={contactDetailsForm.handleSubmit(onContactDetailsSubmit)} className="grid gap-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_address">Address</Label>
                  <Input id="contact_address" {...contactDetailsForm.register("address")} placeholder="123 Main St, Anytown, USA" />
                </div>
                <div>
                  <Label htmlFor="contact_phone">Phone Display Text</Label>
                  <Input id="contact_phone" {...contactDetailsForm.register("phone")} placeholder="+1 (555) 123-4567" />
                </div>
                <div>
                  <Label htmlFor="contact_phone_href">Phone Link (tel:)</Label>
                  <Input id="contact_phone_href" {...contactDetailsForm.register("phone_href")} placeholder="tel:+15551234567" />
                </div>
                 <div>
                  <Label htmlFor="contact_email">Email Address</Label>
                  <Input id="contact_email" type="email" {...contactDetailsForm.register("email")} placeholder="your.email@example.com" />
                   {contactDetailsForm.formState.errors.email && <p className="text-destructive text-sm mt-1">{contactDetailsForm.formState.errors.email.message}</p>}
                </div>
                 <div>
                  <Label htmlFor="contact_email_href">Email Link (mailto:)</Label>
                  <Input id="contact_email_href" {...contactDetailsForm.register("email_href")} placeholder="mailto:your.email@example.com" />
                </div>
              </div>
              <Button type="submit" className="w-full sm:w-auto justify-self-start" disabled={isLoadingContactDetails}>
                <Save className="mr-2 h-4 w-4" /> {isLoadingContactDetails ? 'Saving...' : 'Save Contact Info'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Manage Social Links
            <LinkIcon className="h-6 w-6 text-primary" />
          </CardTitle>
          <CardDescription>Add, edit, or delete social media links for your contact page.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 text-right">
            <Button onClick={() => handleOpenSocialLinkModal()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Social Link
            </Button>
          </div>
          {isLoadingSocialLinks ? (
            <p className="text-center text-muted-foreground">Loading social links...</p>
          ) : socialLinks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No social links found. Add one to get started.</p>
          ) : (
            <div className="space-y-4">
              {socialLinks.map((link) => (
                <Card key={link.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 hover:shadow-md transition-shadow">
                  {link.icon_image_url && (
                    <div className="w-10 h-10 relative mr-4 mb-2 sm:mb-0 flex-shrink-0 rounded-sm overflow-hidden border bg-muted">
                       <NextImage src={link.icon_image_url} alt={`${link.label} icon`} layout="fill" objectFit="contain" className="dark:filter dark:brightness-0 dark:invert" />
                    </div>
                  )}
                  <div className="flex-grow mb-3 sm:mb-0">
                    <h4 className="font-semibold text-lg">{link.label} <span className="text-xs text-muted-foreground">(Sort: {link.sort_order ?? 0})</span></h4>
                    <p className="text-sm text-muted-foreground truncate" title={link.url}>{link.display_text || link.url}</p>
                  </div>
                  <div className="flex space-x-2 self-start sm:self-center shrink-0">
                    <Button variant="outline" size="sm" onClick={() => handleOpenSocialLinkModal(link)}>
                      <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => triggerSocialLinkDeleteConfirmation(link)}>
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isSocialLinkModalOpen} onOpenChange={(isOpen) => { setIsSocialLinkModalOpen(isOpen); if (!isOpen) setCurrentSocialLink(null); }}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader><DialogTitle>{currentSocialLink ? 'Edit Social Link' : 'Add New Social Link'}</DialogTitle></DialogHeader>
          <form onSubmit={socialLinkForm.handleSubmit(onSocialLinkSubmit)} className="grid gap-4 py-4">
            <ScrollArea className="max-h-[70vh] p-1"><div className="grid gap-4 p-3">
              <div><Label htmlFor="social_label">Label <span className="text-destructive">*</span></Label><Input id="social_label" {...socialLinkForm.register("label")} placeholder="e.g., LinkedIn, GitHub" />{socialLinkForm.formState.errors.label && <p className="text-destructive text-sm mt-1">{socialLinkForm.formState.errors.label.message}</p>}</div>
              <div>
                <Label htmlFor="social_icon_image_url">Icon Image URL (Optional)</Label>
                <Input id="social_icon_image_url" {...socialLinkForm.register("icon_image_url")} placeholder="https://example.com/icon.png" />
                {socialLinkForm.formState.errors.icon_image_url && <p className="text-destructive text-sm mt-1">{socialLinkForm.formState.errors.icon_image_url.message}</p>}
                {currentSocialLinkIconUrl && (
                   <div className="mt-2 w-16 h-16 relative border rounded-md bg-muted overflow-hidden">
                     <NextImage src={currentSocialLinkIconUrl} alt="Icon Preview" layout="fill" objectFit="contain" className="dark:filter dark:brightness-0 dark:invert" />
                   </div>
                )}
              </div>
              <div><Label htmlFor="social_url">URL <span className="text-destructive">*</span></Label><Input id="social_url" type="url" {...socialLinkForm.register("url")} placeholder="https://www.example.com" />{socialLinkForm.formState.errors.url && <p className="text-destructive text-sm mt-1">{socialLinkForm.formState.errors.url.message}</p>}</div>
              <div><Label htmlFor="social_display_text">Display Text (Optional)</Label><Input id="social_display_text" {...socialLinkForm.register("display_text")} placeholder="e.g., Follow me on X" /></div>
              <div><Label htmlFor="social_sort_order">Sort Order</Label><Input id="social_sort_order" type="number" {...socialLinkForm.register("sort_order")} /></div>
            </div></ScrollArea>
            <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit">{currentSocialLink ? 'Save Changes' : 'Add Link'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showSocialLinkDeleteConfirm} onOpenChange={setShowSocialLinkDeleteConfirm}>
        <AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground">
          <AlertDialogHeader><AlertDialogTitle className="text-destructive-foreground">Delete Social Link: {socialLinkToDelete?.label}?</AlertDialogTitle><AlertDialogDescription className="text-destructive-foreground/90">This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowSocialLinkDeleteConfirm(false); setSocialLinkToDelete(null); }} className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSocialLink} className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90")}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>View Contact Form Submissions</CardTitle>
            <CardDescription>
              Browse messages submitted through your contact form. (Full functionality for status updates and filtering coming soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Contact submissions viewing is under construction. In the next steps, we will add UI to list submissions, view details, and manage their status (New/Replied/Archived) with filtering options.</p>
          </CardContent>
        </Card>
    </>
  );
}

    