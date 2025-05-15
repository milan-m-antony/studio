
"use server";

import { z } from "zod";
import { supabase } from './supabaseClient'; // Import Supabase client
import { revalidatePath } from 'next/cache'; // For revalidating cache after DB operations

// Contact Form Schema and Action (remains client-side for now or can be adapted)
const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  subject: z.string().min(2, "Subject must be at least 2 characters."),
  message: z.string().min(10, "Message must be at least 10 characters."),
  phoneNumber: z.string().optional(),
});

export interface SubmitContactFormState {
  success: boolean;
  message: string;
  errors?: {
    name?: string[];
    email?: string[];
    subject?: string[];
    message?: string[];
    phoneNumber?: string[];
  };
}

export async function submitContactForm(
  prevState: SubmitContactFormState,
  formData: FormData
): Promise<SubmitContactFormState> {
  const validatedFields = contactFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
    phoneNumber: formData.get("phoneNumber"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Validation failed. Please check your input.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // Example: Save to Supabase 'contacts' table (ensure table exists)
  // const { error } = await supabase.from('contacts').insert([validatedFields.data]);
  // if (error) {
  //   console.error('Supabase error:', error);
  //   return { success: false, message: "Failed to submit message. Please try again." };
  // }

  console.log("Form data (simulated submission):", validatedFields.data);
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    success: true,
    message: "Thank you for your message! I'll get back to you soon.",
  };
}


// Supabase Project CRUD Actions (These are examples, adapt as needed)

// Define Project schema for validation if using with react-hook-form in server components
// or for direct server action validation
const projectActionSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  // image_hint: z.string().optional(), // Removed
  live_demo_url: z.string().url().optional().or(z.literal('')),
  repo_url: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  status: z.string().optional(),
  progress: z.number().min(0).max(100).optional().nullable(),
});


export async function addProjectAction(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  // Transform tags from comma-separated string to array
  if (typeof rawData.tags === 'string') {
    rawData.tags = rawData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
  } else {
    rawData.tags = [];
  }
  // Ensure progress is a number or null
  rawData.progress = rawData.progress ? parseInt(rawData.progress as string, 10) : null;


  const validatedFields = projectActionSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return { success: false, message: "Validation failed.", errors: validatedFields.error.flatten().fieldErrors };
  }
  
  // Remove id for insert
  const { id, ...dataToInsert } = validatedFields.data;

  const { error } = await supabase.from('projects').insert(dataToInsert);

  if (error) {
    console.error("Supabase add project error:", error);
    return { success: false, message: error.message };
  }

  revalidatePath('/'); // Revalidate home page to show new project
  revalidatePath('/admin/dashboard'); // Revalidate admin page
  return { success: true, message: "Project added successfully." };
}

export async function updateProjectAction(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
   if (typeof rawData.tags === 'string') {
    rawData.tags = rawData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
  } else {
    rawData.tags = [];
  }
  rawData.progress = rawData.progress ? parseInt(rawData.progress as string, 10) : null;

  const validatedFields = projectActionSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return { success: false, message: "Validation failed.", errors: validatedFields.error.flatten().fieldErrors };
  }
  
  if (!validatedFields.data.id) {
    return { success: false, message: "Project ID is missing for update." };
  }

  const { error } = await supabase
    .from('projects')
    .update(validatedFields.data)
    .eq('id', validatedFields.data.id);

  if (error) {
    console.error("Supabase update project error:", error);
    return { success: false, message: error.message };
  }

  revalidatePath('/');
  revalidatePath('/admin/dashboard');
  return { success: true, message: "Project updated successfully." };
}

export async function deleteProjectAction(projectId: string) {
  if (!projectId) {
    return { success: false, message: "Project ID is required." };
  }
  const { error } = await supabase.from('projects').delete().eq('id', projectId);

  if (error) {
    console.error("Supabase delete project error:", error);
    return { success: false, message: error.message };
  }

  revalidatePath('/');
  revalidatePath('/admin/dashboard');
  return { success: true, message: "Project deleted successfully." };
}

// Add similar actions for Skills, About content, etc.
