
"use client";

import React, { useEffect, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Though not used in this simple form, good to have if description is added later
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, PlusCircle, Edit, Trash2, Award as CertificateIcon } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import type { Certification } from '@/types/supabase';
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

const certificationSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  issuer: z.string().min(2, "Issuer must be at least 2 characters"),
  date: z.string().min(1, "Date is required (e.g., March 2023)"),
  image_url: z.string().url("Must be a valid URL if provided, or will be set by upload.").optional().or(z.literal("")).nullable(),
  image_hint: z.string().optional().nullable(),
  verify_url: z.string().url("Must be a valid URL if provided.").optional().or(z.literal("")).nullable(),
});
type CertificationFormData = z.infer<typeof certificationSchema>;

interface MappedCertification extends Certification {
    // We use camelCase for imageUrl, verifyUrl in the client-side object for consistency,
    // but DB uses snake_case. Mapping happens during fetch and before save.
}

export default function CertificationsManager() {
  const router = useRouter();
  const { toast } = useToast();

  const [certifications, setCertifications] = useState<MappedCertification[]>([]);
  const [isLoadingCertifications, setIsLoadingCertifications] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCertification, setCurrentCertification] = useState<MappedCertification | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [certificationToDelete, setCertificationToDelete] = useState<MappedCertification | null>(null);
  const [certificationImageFile, setCertificationImageFile] = useState<File | null>(null);
  const [certificationImagePreview, setCertificationImagePreview] = useState<string | null>(null);

  const certificationForm = useForm<CertificationFormData>({
    resolver: zodResolver(certificationSchema),
    defaultValues: { title: '', issuer: '', date: '', image_url: '', image_hint: '', verify_url: '' }
  });

  const currentCertificationImageUrlForPreview = certificationForm.watch('image_url');

  useEffect(() => {
    fetchCertifications();
  }, []);

  useEffect(() => {
    if (certificationImageFile) {
      const reader = new FileReader();
      reader.onloadend = () => setCertificationImagePreview(reader.result as string);
      reader.readAsDataURL(certificationImageFile);
    } else if (currentCertification?.imageUrl) {
      setCertificationImagePreview(currentCertification.imageUrl);
    } else if (certificationForm.getValues('image_url')) {
       setCertificationImagePreview(certificationForm.getValues('image_url'));
    } else {
      setCertificationImagePreview(null);
    }
  }, [certificationImageFile, currentCertification, currentCertificationImageUrlForPreview, certificationForm]);

  useEffect(() => {
    if (currentCertification) {
      certificationForm.reset({
        id: currentCertification.id,
        title: currentCertification.title,
        issuer: currentCertification.issuer,
        date: currentCertification.date,
        image_url: currentCertification.imageUrl || '',
        image_hint: currentCertification.imageHint || '',
        verify_url: currentCertification.verifyUrl || '',
      });
      setCertificationImageFile(null); // Clear file input when editing
    } else {
      certificationForm.reset({ title: '', issuer: '', date: '', image_url: '', image_hint: '', verify_url: '' });
      setCertificationImageFile(null);
      setCertificationImagePreview(null);
    }
  }, [currentCertification, certificationForm]);

  const fetchCertifications = async () => {
    setIsLoadingCertifications(true);
    const { data, error: fetchError } = await supabase
      .from('certifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching certifications:', JSON.stringify(fetchError, null, 2));
      toast({ title: "Error", description: `Could not fetch certifications: ${fetchError.message}`, variant: "destructive" });
      setCertifications([]);
    } else if (data) {
      const mappedData: MappedCertification[] = data.map(c => ({
        ...c, // Spread the raw row data
        imageUrl: c.image_url,   // Explicit mapping for consistency in component
        verifyUrl: c.verify_url, // Explicit mapping
        imageHint: c.image_hint,
      }));
      setCertifications(mappedData);
    } else {
      setCertifications([]);
    }
    setIsLoadingCertifications(false);
  };

  const handleCertificationImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setCertificationImageFile(event.target.files[0]);
      certificationForm.setValue('image_url', ''); // Clear URL if file is chosen
    } else {
      setCertificationImageFile(null);
    }
  };

  const onSubmitCertification: SubmitHandler<CertificationFormData> = async (formData) => {
    let imageUrlToSaveInDb = formData.image_url; // URL from form (could be existing, new manual, or empty)
    let oldImageStoragePathToDelete: string | null = null;

    // Determine if an old image in storage needs to be deleted (when editing)
    if (formData.id && currentCertification?.imageUrl) {
        const pathParts = currentCertification.imageUrl.split('/certification-images/');
        if (pathParts.length > 1 && !pathParts[1].startsWith('http')) { // Basic check it's a Supabase storage URL
            oldImageStoragePathToDelete = pathParts[1];
        }
    }
    
    if (certificationImageFile) { // A new file is being uploaded
      const fileExt = certificationImageFile.name.split('.').pop();
      const fileName = `cert_${Date.now()}.${fileExt}`; 
      const filePath = `${fileName}`; // Path in the 'certification-images' bucket

      toast({ title: "Uploading Certificate Image", description: "Please wait..." });
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('certification-images') 
        .upload(filePath, certificationImageFile, { cacheControl: '3600', upsert: !!formData.id });

      if (uploadError) {
        console.error("Error uploading certificate image:", JSON.stringify(uploadError, null, 2));
        toast({ title: "Upload Error", description: `Failed to upload certificate image: ${uploadError.message}`, variant: "destructive" });
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('certification-images').getPublicUrl(filePath);
      if (!publicUrlData?.publicUrl) {
        toast({ title: "Error", description: "Failed to get public URL for uploaded image.", variant: "destructive" });
        return;
      }
      imageUrlToSaveInDb = publicUrlData.publicUrl; // This is the new URL to save
    }

    const dataForSupabase = {
      // Map form data (camelCase or matching schema) to DB schema (snake_case)
      title: formData.title,
      issuer: formData.issuer,
      date: formData.date,
      image_url: imageUrlToSaveInDb || null,
      image_hint: formData.image_hint || null,
      verify_url: formData.verify_url || null,
    };
    
    if (formData.id) { // Editing existing certification
      const { error: updateError } = await supabase
        .from('certifications')
        .update(dataForSupabase)
        .eq('id', formData.id);
      if (updateError) {
        console.error("Error updating certification:", JSON.stringify(updateError, null, 2));
        toast({ title: "Error", description: `Failed to update certification: ${updateError.message}`, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Certification updated successfully." });
        // Delete old image from storage if a new one was uploaded OR if the URL was cleared/changed
        if (oldImageStoragePathToDelete && imageUrlToSaveInDb !== currentCertification?.imageUrl) {
            console.log("[CertManager] Attempting to delete old cert image from storage:", oldImageStoragePathToDelete);
            const { error: storageDeleteError } = await supabase.storage.from('certification-images').remove([oldImageStoragePathToDelete]);
            if (storageDeleteError) console.warn("[CertManager] Error deleting old cert image from storage:", JSON.stringify(storageDeleteError, null, 2));
        }
      }
    } else { // Adding new certification
      const { error: insertError } = await supabase
        .from('certifications')
        .insert(dataForSupabase);
      if (insertError) {
        console.error("Error adding certification:", JSON.stringify(insertError, null, 2));
        toast({ title: "Error", description: `Failed to add certification: ${insertError.message}`, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Certification added successfully." });
      }
    }
    fetchCertifications();
    setIsModalOpen(false);
    setCertificationImageFile(null); // Reset file input
    certificationForm.reset();
    router.refresh();
  };
  
  const handleDeleteCertification = async () => {
    if (!certificationToDelete) return;
    
    // Attempt to delete image from storage first
    if (certificationToDelete.imageUrl) {
        const imagePath = certificationToDelete.imageUrl.substring(certificationToDelete.imageUrl.indexOf('/certification-images/') + '/certification-images/'.length);
        if (imagePath && !imagePath.startsWith('http')) {
            const { error: storageError } = await supabase.storage.from('certification-images').remove([imagePath]);
            if (storageError) {
                console.warn("[CertManager] Error deleting cert image from storage, proceeding with DB delete:", JSON.stringify(storageError, null, 2));
            }
        }
    }
    
    const { error: deleteError } = await supabase
      .from('certifications')
      .delete()
      .eq('id', certificationToDelete.id);

    if (deleteError) {
      console.error("Error deleting certification:", JSON.stringify(deleteError, null, 2));
      toast({ title: "Error", description: `Failed to delete certification: ${deleteError.message}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Certification deleted successfully." });
      fetchCertifications();
    }
    setShowDeleteConfirm(false);
    setCertificationToDelete(null);
    router.refresh();
  };

  const triggerDeleteConfirmation = (certification: MappedCertification) => {
    setCertificationToDelete(certification);
    setShowDeleteConfirm(true);
  };

  const handleOpenModal = (certification?: MappedCertification) => {
    setCurrentCertification(certification || null);
    setIsModalOpen(true);
  };

  return (
    <Card className="mb-8 shadow-lg">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Manage Certifications
          <CertificateIcon className="h-6 w-6 text-primary" />
        </CardTitle>
        <CardDescription>Add, edit, or delete your certifications.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 text-right">
          <Dialog open={isModalOpen} onOpenChange={(isOpen) => { setIsModalOpen(isOpen); if (!isOpen) { setCurrentCertification(null); setCertificationImageFile(null); certificationForm.reset(); } }}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenModal()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Certification
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>{currentCertification?.id ? 'Edit Certification' : 'Add New Certification'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={certificationForm.handleSubmit(onSubmitCertification)} className="grid gap-4 py-4 max-h-[80vh] overflow-y-auto p-2 scrollbar-hide">
                <div><Label htmlFor="certTitle">Title</Label><Input id="certTitle" {...certificationForm.register("title")} />{certificationForm.formState.errors.title && <p className="text-destructive text-sm mt-1">{certificationForm.formState.errors.title.message}</p>}</div>
                <div><Label htmlFor="certIssuer">Issuer</Label><Input id="certIssuer" {...certificationForm.register("issuer")} />{certificationForm.formState.errors.issuer && <p className="text-destructive text-sm mt-1">{certificationForm.formState.errors.issuer.message}</p>}</div>
                <div><Label htmlFor="certDate">Date Issued</Label><Input id="certDate" {...certificationForm.register("date")} placeholder="e.g., March 2023" />{certificationForm.formState.errors.date && <p className="text-destructive text-sm mt-1">{certificationForm.formState.errors.date.message}</p>}</div>
                
                <div className="space-y-2">
                  <Label htmlFor="cert_image_file">Certificate Image File</Label>
                  <div className="flex items-center gap-3">
                    <Input id="cert_image_file" type="file" accept="image/*" onChange={handleCertificationImageFileChange} className="flex-grow" />
                    <UploadCloud className="h-6 w-6 text-muted-foreground"/>
                  </div>
                  {(certificationImagePreview || currentCertificationImageUrlForPreview) && (
                    <div className="mt-2 p-2 border rounded-md bg-muted aspect-video relative w-full max-w-xs mx-auto">
                      <Image 
                        src={certificationImagePreview || currentCertificationImageUrlForPreview || "https://placehold.co/600x400.png"} 
                        alt="Certificate image preview" 
                        fill 
                        className="rounded object-contain" // No invert for admin preview
                        sizes="(max-width: 480px) 100vw, 33vw"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="image_url_cert" className="text-xs text-muted-foreground">
                      Or enter Image URL (upload will override if a file is chosen)
                    </Label>
                    <Input id="image_url_cert" {...certificationForm.register("image_url")} placeholder="https://example.com/certificate.png" />
                    {certificationForm.formState.errors.image_url && <p className="text-destructive text-sm mt-1">{certificationForm.formState.errors.image_url.message}</p>}
                  </div>
                </div>

                <div><Label htmlFor="certImageHint">Image Hint (for AI placeholder search, e.g., "azure certificate")</Label><Input id="certImageHint" {...certificationForm.register("image_hint")} />{certificationForm.formState.errors.image_hint && <p className="text-destructive text-sm mt-1">{certificationForm.formState.errors.image_hint.message}</p>}</div>
                <div><Label htmlFor="certVerifyUrl">Verification URL (Optional)</Label><Input id="certVerifyUrl" {...certificationForm.register("verify_url")} placeholder="https://example.com/verify/123" />{certificationForm.formState.errors.verify_url && <p className="text-destructive text-sm mt-1">{certificationForm.formState.errors.verify_url.message}</p>}</div>
                
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="outline" onClick={() => {setCertificationImageFile(null); certificationForm.reset();}}>Cancel</Button></DialogClose>
                  <Button type="submit">{currentCertification?.id ? 'Save Changes' : 'Add Certification'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoadingCertifications ? (
          <p className="text-center text-muted-foreground">Loading certifications...</p>
        ) : certifications.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No certifications found. Add one to get started!</p>
        ) : (
          <div className="space-y-4">
            {certifications.map((cert) => (
              <Card key={cert.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 hover:shadow-md transition-shadow">
                {cert.imageUrl && (
                  <div className="w-24 h-16 relative mr-4 mb-2 sm:mb-0 flex-shrink-0 rounded overflow-hidden border bg-muted">
                    <Image src={cert.imageUrl} alt={cert.title} layout="fill" objectFit="contain" />
                  </div>
                )}
                <div className="flex-grow mb-3 sm:mb-0">
                  <h4 className="font-semibold text-lg">{cert.title}</h4>
                  <p className="text-sm text-muted-foreground">{cert.issuer} - {cert.date}</p>
                </div>
                <div className="flex space-x-2 self-start sm:self-center shrink-0">
                  <Button variant="outline" size="sm" onClick={() => handleOpenModal(cert)}>
                    <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => triggerDeleteConfirmation(cert)}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive-foreground">Delete Certification: {certificationToDelete?.title}?</AlertDialogTitle>
            <AlertDialogDescription className="text-destructive-foreground/90">
              This action cannot be undone. This will permanently delete the certification and its image (if any).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowDeleteConfirm(false); setCertificationToDelete(null); }} className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground", "hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCertification} className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive", "hover:bg-destructive-foreground/90")}>Delete Certification</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

