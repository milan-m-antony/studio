
# Personal Portfolio - Milan

This is a dynamic, modern personal portfolio website for Milan, built with Next.js (App Router), React, TypeScript, and Supabase as the backend. It features a comprehensive admin dashboard for managing all content dynamically, including text, images, and file uploads. All public-facing content is fetched from Supabase, and the admin dashboard provides CRUD operations for all sections.

## ✨ Core Features

*   **Dynamic Content Sections (Managed via Admin Dashboard backed by Supabase):**
    *   **Hero Section:** Customizable main name, typewriter subtitles, and social media links (with custom icon image URLs).
    *   **About Me:** Editable headline components (main, code keyword, connector, creativity keyword), multi-paragraph text, image upload, and image tagline.
    *   **Projects Gallery:** Manage project details including title, description, image (upload or URL), live demo/repository links, tags (comma-separated), status (e.g., Deployed, In Progress with progress bar). Displayed in a responsive carousel.
    *   **Skills Overview:** Organize skills into categories. Both categories and individual skills can have custom icon image URLs and descriptions. Includes search functionality on the public page.
    *   **Career Journey/Timeline:** Add and manage education, work experience, certifications, and milestones with dates, descriptions, and custom icon image URLs.
    *   **Certifications & Badges:** Showcase certifications with titles, issuers, dates, images (uploaded), and verification links. Displayed in a responsive carousel with lightbox preview.
    *   **Resume/CV:**
        *   Manage an overall resume description and upload a main PDF resume for download (with "Last Updated" timestamp).
        *   Tabbed Interface for:
            *   **Experience:** Job title, company, dates, description points (bullet points), icon image URL, sort order.
            *   **Education:** Degree/Certification, institution, dates, description, icon image URL, sort order.
            *   **Key Skills:** Categorized skills. Categories can have icon image URLs. Skills are listed as badges.
            *   **Languages:** Language name, proficiency level, icon image URL, sort order.
    *   **Contact Section:** Dynamic contact information (address, phone, email), dynamic social media links (label, URL, icon image URL, display text), and a contact form that saves submissions to the Supabase database.
    *   **Legal Pages:** Dynamically manage content for "Terms & Conditions" and "Privacy Policy," displayed in modals via the footer.

*   **Admin Dashboard (`/admin/dashboard`):**
    *   Secure login using **Supabase Authentication** (email/password for admin user).
    *   Comprehensive UI to Create, Read, Update, and Delete (CRUD) content for all portfolio sections mentioned above.
    *   Image uploads to Supabase Storage for projects, skill categories, skill icons, about me image, certification images, resume item icons, and admin profile photo.
    *   **User Profile Management:** Change admin profile photo, update admin email (username) via Edge Function, change admin password.
    *   **Recent Activity Log:** View recent admin actions (e.g., content updates, logins, logouts), with an option to clear the log.
    *   **Site Settings Management:**
        *   Toggle site-wide Maintenance Mode and edit the custom maintenance message.
        *   "Danger Zone" feature to delete all portfolio data (database records) via a secure Supabase Edge Function, with multi-step confirmation including password re-entry and countdown.
    *   Collapsible sidebar for navigation.
    *   Header with section title, theme toggle, and admin profile dropdown.

*   **Styling & UI:**
    *   ShadCN UI components for a modern and accessible interface.
    *   Tailwind CSS for utility-first styling.
    *   Light/Dark mode toggle, persistent across sessions (public and admin).
    *   Fully responsive design adapting to various screen sizes.
    *   **Preloader Screen:** "1, 2, 3" zoom animation on initial load.
    *   Subtle animations and transitions for a modern feel.

*   **Backend & Operations:**
    *   **Supabase:** PostgreSQL for database, Supabase Storage for file uploads.
    *   **Supabase Edge Functions:**
        *   `send-contact-reply`: For sending email replies to contact form submissions from the admin dashboard (e.g., using Gmail SMTP via Nodemailer).
        *   `danger-delete-all-data`: For securely deleting portfolio database content.
        *   `admin-update-user-email`: For securely updating the admin user's email/username.
    *   **Next.js Server Actions:** Used for public contact form submission.
    *   **Next.js Middleware:** Handles maintenance mode redirection.

## 🛠️ Tech Stack

*   **Frontend:** Next.js (App Router), React, TypeScript
*   **UI:** ShadCN UI, Tailwind CSS
*   **Icons:** Lucide React (for static UI elements), Image URLs for dynamic content icons
*   **Backend & Database:** Supabase (PostgreSQL for database, Supabase Storage for file uploads)
*   **Edge Functions:** Deno (TypeScript) on Supabase
*   **Email Sending (in Edge Function):** Nodemailer (e.g., with Gmail SMTP)
*   **Form Management (Admin):** React Hook Form, Zod for validation
*   **Date Formatting:** date-fns

## 🚀 Getting Started

### Prerequisites

*   Node.js (version 18.x or higher recommended)
*   npm, yarn, or pnpm
*   Supabase Account and a Supabase project (set up at [supabase.com](https://supabase.com))
*   (Optional for Email Replies) A Gmail account with 2-Step Verification and an App Password generated, or another SMTP provider / Resend account.

### Environment Variables

Create a `.env.local` file in the root of your project and add the following variables:

```env
# Supabase Credentials (get from your Supabase project settings -> API)
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Note: Admin credentials are now managed via Supabase Authentication.
# Create your admin user directly in the Supabase Dashboard (Authentication > Users).
# Example: milanmantony2002@gmail.com / Ma@#9746372046
```

Replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` with your actual Supabase project credentials.

### Supabase Setup

1.  **Create a Supabase Project:** If you haven't already, create one at [supabase.com](https://supabase.com).
2.  **Run SQL Schema:** Execute the comprehensive SQL query provided in `docs/SQL_SETUP.md` (or as per the latest instructions) in your Supabase project's SQL Editor. This will create all necessary tables (e.g., `projects`, `skill_categories`, `skills`, `about_content`, `hero_content`, `resume_meta`, `contact_submissions`, `site_settings`, `admin_profile`, etc.) and their Row Level Security (RLS) policies.
    *   The provided SQL includes development-permissive RLS policies (allowing `anon` for some admin operations). For production, these **must** be reviewed and tightened to use the `authenticated` role, and your admin panel must make authenticated Supabase calls.
3.  **Create Admin User in Supabase Auth:**
    *   Go to your Supabase Dashboard > Authentication > Users.
    *   Click "Add user" and create your admin user (e.g., email: `milanmantony2002@gmail.com`, password: `Ma@#9746372046`).
    *   Ensure email confirmation is handled (either confirm the email or temporarily disable email confirmations in Supabase Auth settings for initial setup).
4.  **Create Storage Buckets:** Manually create the following storage buckets in your Supabase project (Storage section). For each, ensure RLS policies allow public reads and appropriate write access for your admin user (or `anon` for development if your admin panel isn't fully making authenticated storage calls yet, though RLS in the provided SQL for database tables often implies admin actions are `authenticated`).
    *   `project-images`
    *   `category-icons`
    *   `skill-icons`
    *   `about-images`
    *   `certification-images`
    *   `resume-pdfs`
    *   `resume-experience-icons` (if using image uploads for these)
    *   `resume-education-icons` (if using image uploads for these)
    *   `resume-language-icons` (if using image uploads for these)
    *   `admin-profile-photos`
5.  **Deploy Edge Functions:**
    *   Manually create and deploy the following Edge Functions in your Supabase Dashboard (Edge Functions section) using the Deno/TypeScript code provided in `docs/edge_functions/`:
        *   `send-contact-reply`
        *   `danger-delete-all-data`
        *   `admin-update-user-email`
    *   **Set Secrets for Edge Functions:** In the Supabase Dashboard for each function, configure the required secrets:
        *   For all functions: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
        *   For `send-contact-reply` (if using Gmail SMTP): `SMTP_USERNAME`, `SMTP_PASSWORD` (Gmail App Password).

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
2.  Ensure your Supabase tables, storage buckets (with RLS), and Edge Functions (with secrets) are created and configured.
3.  Start the Next.js development server:
    ```bash
    npm run dev
    # or
    # yarn dev
    # or
    # pnpm dev
    ```
4.  Open your configured port (e.g., [http://localhost:9002](http://localhost:9002)) in your browser to see the portfolio.
5.  Access the admin dashboard at `/admin/dashboard` (e.g., [http://localhost:9002/admin/dashboard](http://localhost:9002/admin/dashboard)).

### Building for Production

```bash
npm run build
npm run start
```
Remember to configure production environment variables and secure your Supabase RLS policies and Edge Function JWT verification before deploying.

## 📄 License

This project is licensed under the MIT License - see the `LICENSE` file for details (if one exists).

## 📘 Application Blueprint

For a detailed overview of the application's architecture, features, and database schema, please refer to the [Application Blueprint](./docs/blueprint.md).
```