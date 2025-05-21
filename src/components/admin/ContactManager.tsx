
"use client";

import React, { useEffect, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Mail, Link as LinkIconToUse, Phone, MapPin, Save, MessageSquare, Star, Eye, Filter, Send, Loader2, ImageIcon } from 'lucide-react'; // Renamed Link to LinkIconToUse
import { supabase } from '@/lib/supabaseClient';
import type { ContactPageDetail, SocialLink, ContactSubmission, SubmissionStatus } from '@/types/supabase';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogPrimitiveDescription, AlertDialogFooter as AlertDialogPrimitiveFooter, AlertDialogHeader as AlertDialogPrimitiveHeader, AlertDialogTitle as AlertDialogPrimitiveTitle,
} from "@/components/ui/alert-dialog";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import NextImage from 'next/image';
import { format, parseISO, isValid } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';


const PRIMARY_CONTACT_DETAILS_ID = '00000000-0000-0000-0000-000000000005';

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
  icon_image_url: z.string().url("Must be a valid URL if an image URL is provided.").optional().or(z.literal("")).nullable(),
  url: z.string().url("Must be a valid URL"),
  display_text: z.string().optional().nullable(),
  sort_order: z.coerce.number().optional().default(0),
});
type SocialLinkFormData = z.infer<typeof socialLinkSchema>;

const submissionStatuses: SubmissionStatus[] = ['New', 'Replied', 'Archived'];

export default function ContactManager() {
  const router = useRouter();
  const { toast } = useToast();

  // Contact Details State & Form
  const [isLoadingContactDetails, setIsLoadingContactDetails] = useState(false);
  const contactDetailsForm = useForm<ContactPageDetailsFormData>({
    resolver: zodResolver(contactPageDetailsSchema),
    defaultValues: { id: PRIMARY_CONTACT_DETAILS_ID, address: '', phone: '', phone_href: '', email: '', email_href: '' }
  });

  // Social Links State & Form
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
  const watchedSocialLinkIconUrlInModal = socialLinkForm.watch("icon_image_url");

  // Contact Submissions State
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [isViewMessageModalOpen, setIsViewMessageModalOpen] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<ContactSubmission | null>(null);
  const [showSubmissionDeleteConfirm, setShowSubmissionDeleteConfirm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'All'>('All');
  
  // State for Reply Modal
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [submissionToReplyTo, setSubmissionToReplyTo] = useState<ContactSubmission | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);


  // Fetchers
  const fetchContactDetails = async () => {
    setIsLoadingContactDetails(true);
    const { data, error } = await supabase.from('contact_page_details').select('*').eq('id', PRIMARY_CONTACT_DETAILS_ID).maybeSingle();
    if (error) toast({ title: "Error", description: `Could not fetch contact details: ${error.message}`, variant: "destructive" });
    else if (data) contactDetailsForm.reset(data);
    setIsLoadingContactDetails(false);
  };

  const fetchSocialLinks = async () => {
    setIsLoadingSocialLinks(true);
    const { data, error } = await supabase.from('social_links').select('*').order('sort_order', { ascending: true });
    if (error) toast({ title: "Error", description: `Could not fetch social links: ${error.message}`, variant: "destructive" });
    else setSocialLinks((data || []).map(link => ({ ...link, icon_image_url: link.icon_image_url || null })));
    setIsLoadingSocialLinks(false);
  };

  const fetchSubmissions = async () => {
    setIsLoadingSubmissions(true);
    let query = supabase.from('contact_submissions').select('*').order('submitted_at', { ascending: false });
    if (statusFilter !== 'All') {
      query = query.eq('status', statusFilter);
    }
    const { data, error } = await query;
    if (error) toast({ title: "Error", description: `Could not fetch submissions: ${error.message}`, variant: "destructive" });
    else setSubmissions(data || []);
    setIsLoadingSubmissions(false);
  };

  useEffect(() => {
    fetchContactDetails();
    fetchSocialLinks();
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);


  // Handlers for Contact Details
  const onContactDetailsSubmit: SubmitHandler<ContactPageDetailsFormData> = async (formData) => {
    setIsLoadingContactDetails(true);
    const dataToUpsert = { ...formData, id: PRIMARY_CONTACT_DETAILS_ID, updated_at: new Date().toISOString() };
    const { error } = await supabase.from('contact_page_details').upsert(dataToUpsert, { onConflict: 'id' });
    if (error) toast({ title: "Error", description: `Failed to save contact details: ${error.message}`, variant: "destructive" });
    else { 
        toast({ title: "Success", description: "Contact details saved." }); 
        fetchContactDetails(); 
        router.refresh(); 
    }
    setIsLoadingContactDetails(false);
  };

  // Handlers for Social Links
  const onSocialLinkSubmit: SubmitHandler<SocialLinkFormData> = async (formData) => {
    const dataToSave = { ...formData, icon_image_url: formData.icon_image_url?.trim() === '' ? null : formData.icon_image_url, sort_order: Number(formData.sort_order) || 0 };
    const { error } = formData.id
      ? await supabase.from('social_links').update(dataToSave).eq('id', formData.id)
      : await supabase.from('social_links').insert(dataToSave);
    if (error) toast({ title: "Error", description: `Failed to save social link: ${error.message}`, variant: "destructive" });
    else { toast({ title: "Success", description: `Social link ${formData.id ? 'updated' : 'added'}.` }); fetchSocialLinks(); setIsSocialLinkModalOpen(false); router.refresh(); }
  };
  const handleDeleteSocialLink = async () => {
    if (!socialLinkToDelete) return;
    const { error } = await supabase.from('social_links').delete().eq('id', socialLinkToDelete.id);
    if (error) toast({ title: "Error", description: `Failed to delete social link: ${error.message}`, variant: "destructive" });
    else { toast({ title: "Success", description: "Social link deleted." }); fetchSocialLinks(); router.refresh(); }
    setShowSocialLinkDeleteConfirm(false); setSocialLinkToDelete(null);
  };
  const handleOpenSocialLinkModal = (link?: SocialLink) => {
    setCurrentSocialLink(link || null);
    socialLinkForm.reset(link ? { ...link, icon_image_url: link.icon_image_url || '', sort_order: link.sort_order ?? 0 } : { label: '', icon_image_url: '', url: '', display_text: '', sort_order: 0 });
    setIsSocialLinkModalOpen(true);
  };
  const triggerSocialLinkDeleteConfirmation = (link: SocialLink) => { setSocialLinkToDelete(link); setShowSocialLinkDeleteConfirm(true); };

  // Handlers for Contact Submissions
  const handleViewMessage = (submission: ContactSubmission) => { setSelectedSubmission(submission); setIsViewMessageModalOpen(true); };
  
  const handleUpdateSubmissionStatus = async (submissionId: string, newStatus: SubmissionStatus) => {
    const { error } = await supabase.from('contact_submissions').update({ status: newStatus }).eq('id', submissionId);
    if (error) toast({ title: "Error", description: `Failed to update status: ${error.message}`, variant: "destructive" });
    else { toast({ title: "Success", description: "Submission status updated." }); fetchSubmissions(); }
  };

  const handleToggleStar = async (submission: ContactSubmission) => {
    const { error } = await supabase.from('contact_submissions').update({ is_starred: !submission.is_starred }).eq('id', submission.id);
    if (error) toast({ title: "Error", description: `Failed to update star: ${error.message}`, variant: "destructive" });
    else { toast({ title: "Success", description: "Star status updated." }); fetchSubmissions(); }
  };

  const handleDeleteSubmission = async () => {
    if (!submissionToDelete) return;
    const { error } = await supabase.from('contact_submissions').delete().eq('id', submissionToDelete.id);
    if (error) toast({ title: "Error", description: `Failed to delete submission: ${error.message}`, variant: "destructive" });
    else { toast({ title: "Success", description: "Submission deleted." }); fetchSubmissions(); }
    setShowSubmissionDeleteConfirm(false); setSubmissionToDelete(null);
  };
  const triggerSubmissionDeleteConfirmation = (submission: ContactSubmission) => { setSubmissionToDelete(submission); setShowSubmissionDeleteConfirm(true); };

  const handleOpenReplyModal = (submission: ContactSubmission) => {
    setSubmissionToReplyTo(submission);
    setReplyMessage('');
    setIsReplyModalOpen(true);
  };

  const handleSendReply = async () => {
    if (!submissionToReplyTo) {
      toast({ title: "Error", description: "No submission selected to reply to.", variant: "destructive" });
      return;
    }
    if (!replyMessage.trim()) {
      toast({ title: "Missing Information", description: "Please enter a reply message.", variant: "destructive" });
      return;
    }
    if (!submissionToReplyTo.id || !submissionToReplyTo.email || !submissionToReplyTo.name) {
      toast({ title: "Error", description: "Submission data is incomplete for sending a reply.", variant: "destructive" });
      return;
    }

    setIsSendingReply(true);
    const payload = {
      submissionId: submissionToReplyTo.id,
      replyText: replyMessage.trim(),
      recipientEmail: submissionToReplyTo.email,
      recipientName: submissionToReplyTo.name,
    };
    console.log("[ContactManager] Payload for Edge Function (send-contact-reply):", payload);

    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke('send-contact-reply', {
        body: payload,
      });

      if (functionError) {
        console.error("[ContactManager] Error invoking Edge Function (raw):", JSON.stringify(functionError, null, 2));
        throw functionError;
      }
      
      if (functionData && functionData.error) {
         console.error("[ContactManager] Error returned from Edge Function logic:", JSON.stringify(functionData.error, null, 2));
         throw new Error(typeof functionData.error === 'string' ? functionData.error : "An error occurred in the reply Edge Function.");
      }

      toast({ title: "Reply Sent (via Gmail SMTP)", description: functionData?.message || "Your reply has been processed by the server." });
      setIsReplyModalOpen(false);
      setReplyMessage('');
      // Update status locally or re-fetch to see 'Replied' status from Edge function
      const updatedSubmissions = submissions.map(sub => 
        sub.id === submissionToReplyTo.id ? { ...sub, status: 'Replied' as SubmissionStatus } : sub
      );
      setSubmissions(updatedSubmissions);
      // Optionally, call fetchSubmissions() after a short delay if Edge Function updates DB
      // setTimeout(fetchSubmissions, 1000); 
    } catch (error: any) {
      console.error("[ContactManager] Failed to send reply:", error);
      let errorMessage = "Failed to send reply. Please ensure the Edge Function is correctly configured for Gmail SMTP.";
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as {details?: string, message?: string}).message || errorMessage;
      }
      toast({ title: "Error Sending Reply", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSendingReply(false);
    }
  };


  return (
    <>
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">Manage Contact Page Information <Mail className="h-6 w-6 text-primary" /></CardTitle>
          <CardDescription>Update address, phone, email, and social media links for your contact page.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingContactDetails ? (<p className="text-center text-muted-foreground">Loading contact details...</p>) : (
            <form onSubmit={contactDetailsForm.handleSubmit(onContactDetailsSubmit)} className="grid gap-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label htmlFor="contact_address">Address</Label><Input id="contact_address" {...contactDetailsForm.register("address")} placeholder="123 Main St, Anytown, USA" /></div>
                <div><Label htmlFor="contact_phone">Phone Display Text</Label><Input id="contact_phone" {...contactDetailsForm.register("phone")} placeholder="+1 (555) 123-4567" /></div>
                <div><Label htmlFor="contact_phone_href">Phone Link (tel:)</Label><Input id="contact_phone_href" {...contactDetailsForm.register("phone_href")} placeholder="tel:+15551234567" /></div>
                <div><Label htmlFor="contact_email">Email Address</Label><Input id="contact_email" type="email" {...contactDetailsForm.register("email")} placeholder="your.email@example.com" />{contactDetailsForm.formState.errors.email && <p className="text-destructive text-sm mt-1">{contactDetailsForm.formState.errors.email.message}</p>}</div>
                <div><Label htmlFor="contact_email_href">Email Link (mailto:)</Label><Input id="contact_email_href" {...contactDetailsForm.register("email_href")} placeholder="mailto:your.email@example.com" /></div>
              </div>
              <Button type="submit" className="w-full sm:w-auto justify-self-start" disabled={isLoadingContactDetails}><Save className="mr-2 h-4 w-4" /> {isLoadingContactDetails ? 'Saving...' : 'Save Contact Info'}</Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">Manage Social Links <LinkIconToUse className="h-6 w-6 text-primary" /></CardTitle>
          <CardDescription>Add, edit, or delete social media links. Provide a direct image URL for icons.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 text-right"><Button onClick={() => handleOpenSocialLinkModal()} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Add Social Link</Button></div>
          {isLoadingSocialLinks ? (<p className="text-center text-muted-foreground">Loading social links...</p>) : socialLinks.length === 0 ? (<p className="text-muted-foreground text-center py-4">No social links found.</p>) : (
            <div className="space-y-4">
              {socialLinks.map((link) => (
                <Card key={link.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div className="flex items-center gap-3 flex-grow min-w-0">
                      {link.icon_image_url ? (
                        <div className="relative h-5 w-5 rounded-sm overflow-hidden border bg-muted flex-shrink-0">
                          <NextImage src={link.icon_image_url} alt={`${link.label} icon`} width={20} height={20} className="object-contain" />
                        </div>
                      ) : (
                        <ImageIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="flex-grow min-w-0">
                        <h4 className="font-semibold text-sm truncate" title={link.label}>{link.label} <span className="text-xs text-muted-foreground">(Sort: {link.sort_order ?? 0})</span></h4>
                        <p className="text-xs text-muted-foreground truncate" title={link.url}>{link.display_text || link.url}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2 self-start sm:self-end shrink-0 mt-2 sm:mt-0">
                      <Button variant="outline" size="sm" onClick={() => handleOpenSocialLinkModal(link)}><Edit className="mr-1.5 h-3.5 w-3.5" /> Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => triggerSocialLinkDeleteConfirmation(link)}><Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">Contact Form Submissions <MessageSquare className="h-6 w-6 text-primary" /></CardTitle>
          <CardDescription>View and manage messages submitted through your contact form.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <Label htmlFor="statusFilter" className="shrink-0 mb-1 sm:mb-0">Filter by status:</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as SubmissionStatus | 'All')}>
              <SelectTrigger id="statusFilter" className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {submissionStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
             <Button variant="outline" onClick={fetchSubmissions} disabled={isLoadingSubmissions} className="w-full sm:w-auto">
              <Filter className="mr-2 h-4 w-4"/> Apply Filter
            </Button>
          </div>

          {isLoadingSubmissions ? (<p className="text-center text-muted-foreground py-8">Loading submissions...</p>) : submissions.length === 0 ? (<p className="text-muted-foreground text-center py-4">No submissions found{statusFilter !== 'All' ? ` with status "${statusFilter}"` : ''}.</p>) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {submissions.map((sub) => (
                  <Card key={sub.id} className={cn("p-4 hover:shadow-md transition-shadow", sub.status === 'New' ? 'border-primary' : '')}>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 p-0" onClick={() => handleToggleStar(sub)} aria-label={sub.is_starred ? "Unstar submission" : "Star submission"}>
                            <Star className={cn("h-5 w-5", sub.is_starred ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground hover:text-yellow-500")} />
                          </Button>
                          <h4 className="font-semibold text-lg truncate" title={sub.subject || 'No Subject'}>{sub.subject || '(No Subject)'}</h4>
                          <Badge variant={sub.status === 'New' ? 'default' : sub.status === 'Replied' ? 'secondary' : 'outline'}>{sub.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">From: {sub.name} &lt;{sub.email}&gt;</p>
                        {sub.phone_number && <p className="text-sm text-muted-foreground">Phone: {sub.phone_number}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          Received: {sub.submitted_at && isValid(parseISO(sub.submitted_at)) ? format(parseISO(sub.submitted_at), "PPpp") : 'Invalid Date'}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 sm:mt-0 self-start sm:self-center shrink-0 w-full sm:w-auto">
                        <Select
                          value={sub.status || 'New'}
                          onValueChange={(newStatus) => handleUpdateSubmissionStatus(sub.id, newStatus as SubmissionStatus)}
                        >
                          <SelectTrigger className="w-full sm:w-[120px] h-9 text-xs">
                            <SelectValue placeholder="Change status" />
                          </SelectTrigger>
                          <SelectContent>
                            {submissionStatuses.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" onClick={() => handleViewMessage(sub)} className="w-full sm:w-auto"><Eye className="mr-1.5 h-3.5 w-3.5" /> View</Button>
                        <Button variant="outline" size="sm" onClick={() => handleOpenReplyModal(sub)} className="w-full sm:w-auto"><Send className="mr-1.5 h-3.5 w-3.5" /> Reply</Button>
                        <Button variant="destructive" size="sm" onClick={() => triggerSubmissionDeleteConfirmation(sub)} className="w-full sm:w-auto"><Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Social Link Modal & Delete Dialog */}
      <Dialog open={isSocialLinkModalOpen} onOpenChange={(isOpen) => { setIsSocialLinkModalOpen(isOpen); if (!isOpen) setCurrentSocialLink(null); }}>
        <DialogContent className="sm:max-w-[525px]"><DialogHeader><DialogTitle>{currentSocialLink ? 'Edit Social Link' : 'Add New Social Link'}</DialogTitle></DialogHeader>
          <form onSubmit={socialLinkForm.handleSubmit(onSocialLinkSubmit)} className="grid gap-4 py-4">
            <ScrollArea className="max-h-[70vh] p-1"><div className="grid gap-4 p-3">
              <div><Label htmlFor="social_label">Label <span className="text-destructive">*</span></Label><Input id="social_label" {...socialLinkForm.register("label")} placeholder="e.g., LinkedIn, GitHub" />{socialLinkForm.formState.errors.label && <p className="text-destructive text-sm mt-1">{socialLinkForm.formState.errors.label.message}</p>}</div>
              <div>
                <Label htmlFor="social_icon_image_url">Icon Image URL (Optional)</Label>
                <Input id="social_icon_image_url" {...socialLinkForm.register("icon_image_url")} placeholder="https://example.com/icon.png" />
                {socialLinkForm.formState.errors.icon_image_url && <p className="text-destructive text-sm mt-1">{socialLinkForm.formState.errors.icon_image_url.message}</p>}
                {watchedSocialLinkIconUrlInModal && typeof watchedSocialLinkIconUrlInModal === 'string' && watchedSocialLinkIconUrlInModal.trim() !== '' ? (
                    <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Preview:</span>
                        <img src={watchedSocialLinkIconUrlInModal} alt="Icon Preview" className="h-6 w-6 object-contain border rounded-sm bg-muted" />
                    </div>
                ) : (
                    <div className="mt-2 text-xs text-muted-foreground">No preview available. Enter a valid image URL.</div>
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
            <AlertDialogPrimitiveHeader>
                <AlertDialogPrimitiveTitle className="text-destructive-foreground">Delete Social Link: {socialLinkToDelete?.label}?</AlertDialogPrimitiveTitle>
                <AlertDialogPrimitiveDescription className="text-destructive-foreground/90">This action cannot be undone.</AlertDialogPrimitiveDescription>
            </AlertDialogPrimitiveHeader>
            <AlertDialogPrimitiveFooter>
                <AlertDialogCancel onClick={() => { setShowSocialLinkDeleteConfirm(false); setSocialLinkToDelete(null); }} className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteSocialLink} className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90")}>Delete</AlertDialogAction>
            </AlertDialogPrimitiveFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Message Modal */}
      {selectedSubmission && (
        <Dialog open={isViewMessageModalOpen} onOpenChange={setIsViewMessageModalOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Message from: {selectedSubmission.name}</DialogTitle>
              <DialogDescription>Subject: {selectedSubmission.subject || '(No Subject)'}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] my-4 pr-3">
              <div className="space-y-4">
                <div><p className="text-sm font-medium text-muted-foreground">From:</p><p>{selectedSubmission.name} &lt;{selectedSubmission.email}&gt;</p></div>
                {selectedSubmission.phone_number && <div><p className="text-sm font-medium text-muted-foreground">Phone:</p><p>{selectedSubmission.phone_number}</p></div>}
                <div><p className="text-sm font-medium text-muted-foreground">Received:</p><p>{selectedSubmission.submitted_at && isValid(parseISO(selectedSubmission.submitted_at)) ? format(parseISO(selectedSubmission.submitted_at), "PPpp") : 'Invalid Date'}</p></div>
                <div><p className="text-sm font-medium text-muted-foreground">Status:</p><p>{selectedSubmission.status}</p></div>
                <div><p className="text-sm font-medium text-muted-foreground">Message:</p><p className="whitespace-pre-wrap bg-muted p-3 rounded-md">{selectedSubmission.message}</p></div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Close</Button></DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reply Modal */}
      {submissionToReplyTo && (
        <Dialog open={isReplyModalOpen} onOpenChange={(isOpen) => { if(!isOpen) setSubmissionToReplyTo(null); setIsReplyModalOpen(isOpen); }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Reply to: {submissionToReplyTo.name}</DialogTitle>
              <DialogDescription>Replying to: {submissionToReplyTo.email}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label htmlFor="replyMessage">Your Reply</Label>
                <Textarea
                  id="replyMessage"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={8}
                  placeholder="Compose your reply..."
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" disabled={isSendingReply}>Cancel</Button></DialogClose>
              <Button type="button" onClick={handleSendReply} disabled={isSendingReply || !replyMessage.trim()}>
                {isSendingReply ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send Reply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Submission Confirmation Dialog */}
      <AlertDialog open={showSubmissionDeleteConfirm} onOpenChange={setShowSubmissionDeleteConfirm}>
        <AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground">
            <AlertDialogPrimitiveHeader>
                <AlertDialogPrimitiveTitle className="text-destructive-foreground">Delete Submission from: {submissionToDelete?.name}?</AlertDialogPrimitiveTitle>
                <AlertDialogPrimitiveDescription className="text-destructive-foreground/90">This action cannot be undone and will permanently delete this message.</AlertDialogPrimitiveDescription>
            </AlertDialogPrimitiveHeader>
            <AlertDialogPrimitiveFooter>
                <AlertDialogCancel onClick={() => { setShowSubmissionDeleteConfirm(false); setSubmissionToDelete(null); }} className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteSubmission} className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90")}>Delete Message</AlertDialogAction>
            </AlertDialogPrimitiveFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
    

    