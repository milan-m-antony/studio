
# Personal Portfolio - Milan

This is a dynamic, modern personal portfolio website for Milan, built with Next.js (App Router), React, TypeScript, and Supabase as the backend. It features a comprehensive admin dashboard for managing all content dynamically, including text, images, and file uploads. All public-facing content is fetched from Supabase, and the admin dashboard provides CRUD operations for all sections.

## ✨ Core Features

*   **Dynamic Content Sections (Managed via Admin Dashboard backed by Supabase):**
    *   **Hero Section:** Customizable main name, typewriter subtitles, and dynamic social media links (with image URLs).
    *   **About Me:** Editable headline components, multi-paragraph text, image upload, and image tagline.
    *   **Projects Gallery:** Manage project details including title, description, image (upload or URL), live demo/repository links, tags, status, and progress. Displayed in a responsive carousel.
    *   **Skills Overview:** Organize skills into categories. Both categories and individual skills can have uploaded icon images and descriptions. Includes search functionality on the public page.
    *   **Career Journey/Timeline:** Add and manage education, work experience, certifications, and milestones with dates, descriptions, and uploaded/linked icon images.
    *   **Certifications & Badges:** Showcase certifications with titles, issuers, dates, images (uploaded), and verification links. Displayed in a responsive carousel with lightbox preview.
    *   **Resume/CV:**
        *   Manage an overall resume description and upload a main PDF resume for download (with "Last Updated" timestamp).
        *   Tabbed Interface for: Experience, Education, Key Skills (categorized), and Languages, all with optional icon image URLs.
    *   **Contact Section:** Dynamic contact information, dynamic social media links, and a contact form that saves submissions to the Supabase database.
    *   **Legal Pages:** Dynamically manage content for "Terms & Conditions" and "Privacy Policy," displayed in modals via the footer.

*   **Admin Dashboard (`/admin/dashboard`):**
    *   Secure login using **Supabase Authentication** (email/password for admin user).
    *   Comprehensive UI to Create, Read, Update, and Delete (CRUD) content for all portfolio sections.
    *   Image uploads to Supabase Storage for projects, skill categories, skill icons, about me image, certification images, resume item icons, and admin profile photo.
    *   **Admin Profile Management:** Change admin profile photo, update admin email/username via Edge Function, change admin password.
    *   **Recent Activity Log:** View recent admin actions, with an option to clear the log.
    *   **Site Settings Management:**
        *   Toggle site-wide Maintenance Mode and edit the custom maintenance message.
        *   "Danger Zone" feature to delete all portfolio data (database records and associated storage files) via a secure Supabase Edge Function, with multi-step confirmation.
    *   Collapsible sidebar for navigation.
    *   Header with section title, theme toggle, and admin profile dropdown.

*   **Styling & UI:**
    *   ShadCN UI components for a modern and accessible interface.
    *   Tailwind CSS for utility-first styling.
    *   Light/Dark mode toggle, persistent across sessions (public and admin).
    *   Fully responsive design.
    *   **Preloader Screen:** "1, 2, 3" zoom animation on initial load.

*   **Backend & Operations:**
    *   **Supabase:** PostgreSQL for database, Supabase Storage for file uploads, Supabase Authentication for admin users.
    *   **Supabase Edge Functions:**
        *   `send-contact-reply`: For sending email replies to contact form submissions from the admin dashboard (e.g., using Gmail SMTP via Nodemailer).
        *   `danger-delete-all-data`: For securely deleting portfolio database content and related storage files.
        *   `admin-update-user-email`: For securely updating the admin user's email/username.
    *   **Next.js Server Actions:** Used for public contact form submission.
    *   **Next.js Middleware:** Handles maintenance mode redirection.

## 🛠️ Tech Stack

*   **Frontend:** Next.js (App Router), React, TypeScript
*   **UI:** ShadCN UI, Tailwind CSS
*   **Icons:** Uploaded Image URLs for dynamic content icons, Lucide React for static UI elements.
*   **Backend & Database:** Supabase (PostgreSQL, Supabase Storage, Supabase Authentication, Supabase Edge Functions)
*   **Email Sending (in Edge Function):** Nodemailer (e.g., with Gmail SMTP)
*   **Form Management (Admin):** React Hook Form, Zod for validation
*   **Date Formatting:** date-fns

## 🚀 Getting Started

### Prerequisites

*   Node.js (version 18.x or higher recommended)
*   npm, yarn, or pnpm
*   Supabase Account and a Supabase project (set up at [supabase.com](https://supabase.com))
*   (For Email Replies via Gmail SMTP) A Gmail account with 2-Step Verification and an App Password generated.

### Environment Variables

Create a `.env.local` file in the root of your project and add the following variables:

```env
# Supabase Credentials (get from your Supabase project settings -> API)
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Credentials for Admin Dashboard Login (using Supabase Auth for this user)
# The actual user is created in Supabase Auth, not via these env vars for login directly.
# These might be used for initial setup or if you have parts of the app that need to know the admin email.
NEXT_PUBLIC_ADMIN_USERNAME=milanmantony2002@gmail.com # Example admin email

# For Supabase Edge Function: send-contact-reply (using Gmail SMTP)
# These are set as SECRETS in your Supabase Function settings, not directly in .env.local for function use.
# SMTP_USERNAME=your-gmail-address@gmail.com
# SMTP_PASSWORD=your-gmail-app-password-16-chars
```

Replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` with your actual Supabase project credentials.
**Note:** For Edge Functions, secrets like `SMTP_USERNAME` and `SMTP_PASSWORD` must be configured directly in the Supabase Dashboard under the specific function's settings.

### Supabase Setup

1.  **Create a Supabase Project:** If you haven't already, create one at [supabase.com](https://supabase.com).
2.  **Run SQL Schema:**
    *   Navigate to the **SQL Editor** in your Supabase project dashboard.
    *   Copy the entire content of the latest "complete SQL query" provided in the development chat (or from a `schema.sql` file if one is maintained in the project) which includes `CREATE TABLE` statements and RLS policies for all tables (`projects`, `skill_categories`, `skills`, `about_content`, `hero_content`, `resume_meta`, all `resume_*` tables, `contact_page_details`, `social_links`, `contact_submissions`, `site_settings`, `admin_profile`, `legal_documents`, `admin_activity_log`).
    *   Paste this SQL into a new query window and run it. This will set up your database structure and necessary Row Level Security policies for development (allowing `anon` some write access) and production (requiring `authenticated` role).
3.  **Create Admin User in Supabase Auth:**
    *   Go to your Supabase Dashboard > Authentication > Users.
    *   Click "Add user".
    *   Set the email to `milanmantony2002@gmail.com` and password to `Ma@#9746372046` (or your chosen secure password).
    *   Handle email confirmation: Either confirm the email or temporarily disable "Enable email confirmations" in Supabase Auth settings (under "Configuration") for initial local setup.
4.  **Create Storage Buckets:**
    Manually create the following storage buckets in your Supabase project (Dashboard > Storage > Buckets > "Create new bucket"). For each bucket, after creation, go to its policies and ensure appropriate access. For development, you might set broad public read and `anon` write access. For production, tighten these.
    *   `project-images`
    *   `category-icons`
    *   `skill-icons`
    *   `about-images`
    *   `certification-images`
    *   `resume-pdfs`
    *   `resume-experience-icons` (if you choose to upload icons for these)
    *   `resume-education-icons` (if you choose to upload icons for these)
    *   `resume-language-icons` (if you choose to upload icons for these)
    *   `admin-profile-photos`
    **Example RLS for a bucket (e.g., `project-images` - apply similar to others, adjusting for public read needs):**
    ```sql
    -- Allow public read access
    CREATE POLICY "Public read access for project-images" ON storage.objects
    FOR SELECT USING (bucket_id = 'project-images');

    -- Allow authenticated admin uploads
    CREATE POLICY "Authenticated admin can upload to project-images" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'project-images');
    -- Add UPDATE and DELETE policies for authenticated role as needed.
    ```
5.  **Deploy Edge Functions:**
    *   Go to your Supabase Dashboard > Edge Functions.
    *   For each function (`send-contact-reply`, `danger-delete-all-data`, `admin-update-user-email`):
        *   Click "Create a function".
        *   Name it exactly as listed (e.g., `send-contact-reply`).
        *   Copy the Deno/TypeScript code provided for that function (from development chat or project `supabase/functions/<function-name>/index.ts` if maintained locally) and paste it into the online editor.
        *   **Set Secrets for Each Function:** In the function's settings, add the required secrets:
            *   **All functions:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
            *   **`send-contact-reply` (if using Gmail SMTP):** `SMTP_USERNAME` (your Gmail), `SMTP_PASSWORD` (your Gmail App Password).
            *   **`admin-update-user-email`:** Does not need extra secrets beyond the Supabase ones if it's just using `auth.admin` calls.
            *   **`danger-delete-all-data`:** Does not need extra secrets beyond the Supabase ones.
        *   **JWT Verification:**
            *   For `send-contact-reply` and `danger-delete-all-data`: If called from your admin panel while it's using Supabase Auth, JWT verification should be **ENABLED**. For initial local testing before full Supabase Auth in admin, you might temporarily disable it.
            *   For `admin-update-user-email`: JWT verification should be **ENABLED** as it relies on the authenticated user's ID.
        *   Deploy each function.

### Installation

1.  Clone the repository:
    ```bash
    git clone <your-repo-url>
    cd <project-directory>
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or
    # yarn install
    # or
    # pnpm install
    ```

### Running the Development Server

1.  Ensure your `.env.local` file is set up with Supabase credentials.
2.  Ensure your Supabase database tables, RLS policies, storage buckets (with RLS), and Edge Functions (with secrets) are created and configured.
3.  Start the Next.js development server:
    ```bash
    npm run dev
    # or
    # yarn dev
    # or
    # pnpm dev
    ```
4.  Open `http://localhost:YOUR_PORT` (e.g., `http://localhost:9002`) in your browser.
5.  Access the admin dashboard at `/admin/dashboard`.

### Building for Production

```bash
npm run build
npm run start
```

## Vercel Hosting Instructions

Deploying this Next.js application to Vercel is straightforward.

1.  **Push to GitHub/GitLab/Bitbucket:** Ensure your project is in a Git repository hosted on one of these platforms.
2.  **Import Project in Vercel:**
    *   Sign up or log in to [vercel.com](https://vercel.com).
    *   Click "Add New..." > "Project".
    *   Import your Git repository.
3.  **Configure Project Settings:**
    *   **Framework Preset:** Vercel should automatically detect "Next.js".
    *   **Build & Development Settings:** Usually, the defaults are fine (Root Directory, Build Command: `npm run build` or `next build`, Output Directory: `.next`).
    *   **Environment Variables:** This is crucial. You need to add the same environment variables you have in your `.env.local` file (and any server-side secrets for Edge Functions if they were not embedded).
        *   Go to your Project Settings in Vercel > Environment Variables.
        *   Add:
            *   `NEXT_PUBLIC_SUPABASE_URL` (Value: Your Supabase Project URL)
            *   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Value: Your Supabase Project Anon Key)
            *   `NEXT_PUBLIC_ADMIN_USERNAME` (Value: e.g., `milanmantony2002@gmail.com`)
            *   **Note on Edge Function Secrets:** For secrets used by Supabase Edge Functions (like `SMTP_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`), these are configured within the Supabase dashboard for each function, not as Vercel environment variables for the Next.js app, unless your Next.js backend/API routes were *also* directly using them (which is not the current setup for email sending).
    *   **Supabase Auth Redirect Configuration (Important for Production):**
        *   In your Supabase Project Dashboard > Authentication > URL Configuration:
            *   **Site URL:** Set this to your Vercel production domain (e.g., `https://your-project-name.vercel.app`).
            *   **Redirect URLs:** Add your Vercel production domain and any custom domains to the list of allowed redirect URLs.
4.  **Deploy:** Click the "Deploy" button. Vercel will build and deploy your application.

## 📄 License

This project is licensed under the MIT License - see the `LICENSE` file for details (if one exists).

## 📘 Application Blueprint

For a detailed overview of the application's architecture, features, and database schema, please refer to the [Application Blueprint](./docs/blueprint.md).
