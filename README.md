
# Personal Portfolio - Milan

This is a dynamic personal portfolio website built with Next.js (App Router), React, TypeScript, and Supabase as the backend. It features a comprehensive admin dashboard for managing all content dynamically, including text, images, and file uploads.

## ✨ Core Features

*   **Dynamic Content Sections (Managed via Admin Dashboard):**
    *   **Hero Section:** Customizable name, typewriter subtitles, and social media links (icon image URLs).
    *   **About Me:** Editable headline components, multi-paragraph text, image, and image tagline.
    *   **Projects Gallery:** Manage project details including title, description, image, live demo/repository links, tags, status (e.g., Deployed, In Progress), and progress percentage. Displayed in a responsive carousel.
    *   **Skills Overview:** Organize skills into categories. Both categories and individual skills can have custom icon image URLs and descriptions. Includes search functionality on the public page.
    *   **Career Journey/Timeline:** Add and manage education, work experience, certifications, and milestones with dates, descriptions, and icon image URLs.
    *   **Certifications & Badges:** Showcase certifications with titles, issuers, dates, images, and verification links. Displayed in a responsive carousel with lightbox preview.
    *   **Resume/CV:**
        *   Manage an overall resume description.
        *   Upload a PDF resume for download.
        *   Detail Experience (job title, company, dates, description points, icon image URL).
        *   Detail Education (degree, institution, dates, description, icon image URL).
        *   Detail Key Skills (categorized, with icon image URLs for categories).
        *   Detail Languages (name, proficiency, icon image URL).
    *   **Contact Section:** Dynamic contact information (address, phone, email), dynamic social media links (label, URL, icon image URL), and a contact form that saves submissions to the Supabase database.
    *   **Legal Pages:** Dynamically manage content for Terms & Conditions and Privacy Policy, displayed in modals via the footer.

*   **Admin Dashboard (`/admin/dashboard`):**
    *   Secure login using credentials stored in environment variables.
    *   Comprehensive UI to Create, Read, Update, and Delete (CRUD) content for all portfolio sections mentioned above.
    *   Image uploads to Supabase Storage for projects, skill categories, skill icons, about me image, certification images, resume PDF, and resume item icons.
    *   Recent activity log to track admin actions.
    *   Site settings management (e.g., Maintenance Mode toggle and custom message).
    *   Admin profile photo management.

*   **Styling & UI:**
    *   ShadCN UI components for a modern and accessible interface.
    *   Tailwind CSS for utility-first styling.
    *   Light/Dark mode toggle for user preference.
    *   Responsive design adapting to various screen sizes.
    *   Preloader screen with a "1, 2, 3" zoom animation.

*   **Maintenance Mode:** Site-wide maintenance mode toggleable from the admin dashboard, displaying a custom message to visitors.

## 🛠️ Tech Stack

*   **Frontend:** Next.js (App Router), React, TypeScript
*   **UI:** ShadCN UI, Tailwind CSS
*   **Icons:** Lucide React (for static UI elements), Image URLs for dynamic content icons
*   **Backend & Database:** Supabase (PostgreSQL for database, Supabase Storage for file uploads)
*   **Form Management (Admin):** React Hook Form, Zod for validation
*   **Date Formatting:** date-fns
*   **Styling:** Tailwind CSS, CSS Modules (as needed by Next.js structure)

## 🚀 Getting Started

### Prerequisites

*   Node.js (version 18.x or higher recommended)
*   npm, yarn, or pnpm
*   A Supabase project (set up at [supabase.com](https://supabase.com))

### Environment Variables

Create a `.env.local` file in the root of your project and add the following variables:

```env
# Supabase Credentials (get from your Supabase project settings -> API)
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Admin Dashboard Credentials (choose your own)
NEXT_PUBLIC_ADMIN_USERNAME=your_admin_username
NEXT_PUBLIC_ADMIN_PASSWORD=your_admin_password
```

Replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` with your actual Supabase project credentials. Set your desired admin username and password.

### Supabase Setup

1.  **Create a Supabase Project:** If you haven't already, create one at [supabase.com](https://supabase.com).
2.  **Run SQL Schema:** Execute the comprehensive SQL query provided (usually in `SQL_SETUP.md` or as per instructions from the AI assistant like the one in `docs/SQL_SETUP.md`) in the Supabase SQL Editor. This will create all necessary tables (`projects`, `skill_categories`, `skills`, `certifications`, `timeline_events`, `about_content`, `resume_meta`, `resume_experience`, `resume_education`, `resume_key_skill_categories`, `resume_key_skills`, `resume_languages`, `hero_content`, `contact_page_details`, `social_links`, `contact_submissions`, `site_settings`, `admin_profile`, `admin_activity_log`, `legal_documents`) and their Row Level Security (RLS) policies.
    *The provided SQL includes development-permissive RLS policies for the `anon` role. For production, these **must** be reviewed and tightened, and proper Supabase Authentication should be implemented for the admin dashboard.*
3.  **Create Storage Buckets:** Manually create the following storage buckets in your Supabase project (Storage section). Ensure their RLS policies allow public reads and (for development with current admin setup) anonymous uploads/deletes. The bucket names are:
    *   `project-images`
    *   `category-icons` (for skill categories)
    *   `skill-icons`
    *   `about-images`
    *   `certification-images`
    *   `resume-pdfs`
    *   `resume-experience-icons`
    *   `resume-education-icons`
    *   `resume-language-icons`
    *   `admin-profile-photos`
    *(Note: Icon buckets for resume items like experience, education, languages are needed if you plan to use image uploads for them, which the admin panel now supports).*

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

1.  Ensure your `.env.local` file is set up with Supabase and admin credentials.
2.  Ensure your Supabase tables and storage buckets (with RLS) are created.
3.  Start the Next.js development server:
    ```bash
    npm run dev
    # or
    # yarn dev
    # or
    # pnpm dev
    ```
4.  Open [http://localhost:9002](http://localhost:9002) (or your configured port) in your browser to see the portfolio.
5.  Access the admin dashboard at [http://localhost:9002/admin/dashboard](http://localhost:9002/admin/dashboard).

### Building for Production

```bash
npm run build
npm run start
```
Remember to configure production environment variables and secure your Supabase RLS policies before deploying.

## 📄 License

This project is licensed under the MIT License - see the `LICENSE` file for details (if one exists).

## 📘 Application Blueprint

For a detailed overview of the application's architecture, features, and database schema, please refer to the [Application Blueprint](./docs/blueprint.md).
